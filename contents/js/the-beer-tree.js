var kegLife = d3.select("#keg-life"),
    calendar = d3.select("#calendar"),
    costComparison = d3.select("#cost-comparison");

var width = Number(kegLife.style("width").slice(0, kegLife.style("width").length - 2)),
    margin = {top: 40, right: 10, bottom: 80, left: 100};

var parseDate = d3.time.format("%Y-%m-%d");

var today = new Date();
today.setHours(0, 0, 0, 0);


function purchaseDate(d) { return d.date; }
function msToDays(d) { return Math.floor(d * 1.15741e-8); }


function buildKegLife(data) {
    var height = width / 2;

    var maxBeersPerDay = d3.max(data.kegPurchases, function(d) { return d.beersPerDay; });

    var xscale = d3.scale.linear()
        .domain([0, maxBeersPerDay])
        .range([0, width]);

    var xaxis = d3.svg.axis()
        .orient("top")
        .scale(xscale);

    var barHeight = (height - margin.top) / data.kegPurchases.length;
    var barSpacing = 10;

    var svg = kegLife.append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var bar = svg.selectAll("g.bar").data(data.kegPurchases);
    bar.enter().append("g")
        .attr("class", "bar");
    bar
        .attr("transform", function(d, i) {
            return "translate(0," + (i * barHeight + barSpacing) + ")";
        })
    bar.append("rect")
        .attr("width", function(d) {
            if (d.beersPerDay)
                return xscale(d.beersPerDay);
            else
                return xscale.range()[1];
        })
        .attr("height", barHeight - 2 * barSpacing)
        .each(function(d) {
            var e = d3.select(this); 
            var color = data["beers"][d.beer].color;
            if (!d.kicked) {
                e.style("fill", "none");
                e.style("stroke", color);
                e.style("stroke-width", "3px");
            } else {
                e.style("fill", color);
            }
        });
    bar.append("text")
        .attr("y", barHeight / 2)
        .attr("x", 20)
        .attr("dy", 0.5)
        .text(function(d) {
            var name = data["beers"][d.beer].name;
            var descriptor = d.kicked ? d.keg + " keg in " + msToDays(d.dateRange) + " days" : d.keg + " keg, unkicked";
            return name + ", " + descriptor;
        });
    bar.append("text")
        .attr("class", "keg-date")
        .attr("y", barSpacing + 6)
        .attr("dy", 0.5)
        .attr("x", -20)
        .attr("text-anchor", "end")
        .text(function(d) { return d3.time.format("%B %e")(d.date); })

    svg.append("g")
        .attr("class", "x axis")
        .call(xaxis);
    svg.append("text")
        .text("beers per day")
        .attr("x", -25)
        .attr("y", -25)
        .style("font-size", "12px");
}


function buildCostComparison(data) {
    var height = width / 2;

    var purchases = data["purchases"],
        colors = ["steelblue", "red"],
        names = ["Expenses", "Fair market value"];
    
    purchases.forEach(function(d, i, a) {
        if (i === 0)
            d.cumulativeCost = d.cost;
        else
            d.cumulativeCost = d.cost + a[i-1].cumulativeCost;
    });
    var fairMarketValue = purchases.reduce(function(previous, current) {
        if (!current.keg)
            return previous

        var cumulativeCost = previous.length > 0 ? previous[previous.length - 1].forwardCumulativeCost : 0;
        var cost = (current.numberOfBeers / 6) * data.beers[current.beer].sixPackCost;

        previous.push({
            "date": current.date,
            "cost": cost,
            "cumulativeCost": cumulativeCost,
            "forwardCumulativeCost": cumulativeCost + cost
        });
        return previous;
    }, []);
    fairMarketValue.push({
        "date": today,
        "cumulativeCost": fairMarketValue[fairMarketValue.length - 1].forwardCumulativeCost}
        );

    var maxCost = d3.max([fairMarketValue, purchases], function(d) {
        return d3.max(d, function(e) { return e.cumulativeCost; });
    });

    var xscale = d3.time.scale()
        .domain(d3.extent(purchases, function(d) { return d.date; }))
        .range([0, width])
        .nice();

    var xaxis = d3.svg.axis()
        .orient("bottom")
        .scale(xscale);

    var yscale = d3.scale.linear()
        .domain([0, maxCost])
        .range([height, 0])
        .nice();

    var yaxis = d3.svg.axis()
        .orient("left")
        .tickFormat(function(d) { return "$" + d; })
        .scale(yscale);

    var line = d3.svg.line()
        .x(function(d) { return xscale(d.date); })
        .y(function(d) { return yscale(d.cumulativeCost); });
   
    var svg = costComparison.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var path = svg.selectAll(".line").data([purchases, fairMarketValue]);
    path.enter().append("g")
        .attr("class", "line")
        .append("path")
        .style("stroke", function(d, i) { return colors[i]; })
        .attr("d", line);

    var dataPoints = svg.selectAll(".data-points").data(purchases)
        .enter().append("g");
    
    dataPoints.append("circle")
        .attr("class", "data-points")
        .attr("cx", function(d) { return xscale(d.date); })
        .attr("cy", function(d) { return yscale(d.cumulativeCost); })
        .attr("r", function(d) { return d.beer ? 5 : 3; })
        .style("stroke", function(d) { return d.beer ? data.beers[d.beer].color : "steelblue"; });
    dataPoints.append("text")
        .attr("x", function(d) { return xscale(d.date) + 8; })
        .attr("y", function(d, i) {
            var y = yscale(d.cumulativeCost) + 14;
            return y;
        })
        .attr("dy", 0.35)
        .text(function(d) {
            if (d.name)
                return "";
            else
                return data.beers[d.beer].name + ", " + d.keg + " keg";
        })
        .style("font-size", "10px")
        .style("text-anchor", function(d) {
              if ((xscale.domain()[1] - d.date) / (xscale.domain()[1] - xscale.domain()[0]) < 0.2)
                  return "end";
              else
                  return "start";
        });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xaxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yaxis);

    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width / 2 - 50) + "," + (height + 40) + ")");

    var legendEntry = legend.selectAll(".legend-entry").data([purchases, fairMarketValue]);
    legendEntry.enter().append("g")
        .attr("class", "legend-entry")
        .attr("transform", function(d, i) {
            return "translate(0," + i * 16 + ")";
        });
    legendEntry.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function(d, i) { return colors[i]; })
    legendEntry.append("text")
        .attr("x", 16) 
        .attr("y", 8) 
        .attr("dy", 0.5)
        .text(function(d, i) { return names[i]; });


}


d3.json("../data/the-beer-tree.json", function(error, data) {
    data.kegPurchases = data["purchases"].filter(function(d) {
        d.date = parseDate.parse(d.date);
        if (d.endDate)
            d.endDate = parseDate.parse(d.endDate);
        return d.keg;
    });
    data["purchases"].sort(function(a, b) { return a.date - b.date; });
    data.kegPurchases.forEach(function(d, i, a) {
        d.numberOfBeers = Math.floor(data.kegs[d.keg].gallons * 128 / 12 );
        if (!d.endDate) {
            d.endDate = today;
            d.dateRange = null;
            d.beersPerDay = null;
            d.kicked = false;
        } else {
            d.dateRange = d.endDate - d.date;
            d.beersPerDay = d.numberOfBeers / msToDays(d.dateRange);
            d.kicked = true;
        }
    });

    buildKegLife(data);
    buildCostComparison(data);
    calendar
        .style("display", "none");
});

var kegLife = d3.select("#keg-life"),
    calendar = d3.select("#calendar"),
    costComparison = d3.select("#cost-comparison");

var width = Number(kegLife.style("width").slice(0, kegLife.style("width").length - 2)),
    margin = {top: 40, right: 10, bottom: 100, left: 100};

var parseDate = d3.time.format("%Y-%m-%d");

var today = new Date();
today.setHours(0, 0, 0, 0);


function purchaseDate(d) { return d.date; }
function msToDays(d) { return Math.floor(d * 1.15741e-8); }


function buildKegLife(data) {
    var height = width / 2;

    var maxDateRange = d3.max(data.kegPurchases, function(d) { return d.dateRange; });

    var xscale = d3.scale.linear()
        .domain([0, maxDateRange])
        .range([0, width]);

    var xaxis = d3.svg.axis()
        .orient("top")
        .scale(xscale)
        .tickFormat(function(d) { return msToDays(d) + " days"; });

    var barHeight = (height - margin.top - margin.bottom) / data.kegPurchases.length;
    var barSpacing = 10;

    var svg = kegLife.append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
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
        .attr("width", function(d) { return xscale(d.dateRange); })
        .attr("height", barHeight - 2 * barSpacing)
        .style("fill", function(d) {
            var color = data["beers"][d.beer].color;
            return d.kicked ? color : d3.hsl(color).brighter(1.2);
        });
    bar.append("text")
        .attr("y", barHeight / 2)
        .attr("x", 20)
        .attr("dy", 0.5)
        .text(function(d) {
            var name = data["beers"][d.beer].name;
            var descriptor = d.kicked ? "kicked in " + msToDays(d.dateRange) + " days" : "unkicked";
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
}


function buildCostComparison(data) {
    var height = width / 2;

    var purchases = data["purchases"],
        colors = ["steelblue", "red"],
        names = ["Spending", "Fair market value"];
    
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
        var cost = (Math.floor(data.kegs[current.keg].gallons * 128 / 12 )/ 6) * data.beers[current.beer].sixPackCost;

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
        return d.keg;
    });
    data["purchases"].sort(function(a, b) { return a.date - b.date; });
    data.kegPurchases.forEach(function(d, i, a) {
        if (!d.endDate)
            d.endDate = today;
        d.dateRange = d.endDate - d.date;
    });

    buildKegLife(data);
    buildCostComparison(data);
    calendar
        .style("display", "none");
});

var kegLife = d3.select("#keg-life"),
    calendar = d3.select("#calendar"),
    costComparison = d3.select("#costComparison");

var width = Number(kegLife.style("width").slice(0, kegLife.style("width").length - 2));

var parseDate = d3.time.format("%Y-%m-%d");

function purchaseDate(d) { return d.date; }


function buildKegLife(data) {
    var height = width / 2
        padding = {top: 40, right: 60, bottom: 0, left: 60};

    var kegPurchases = data["purchases"].filter(function(d) {
        return d.keg;
    });
    var maxDateRange;
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    kegPurchases.forEach(function(d, i, a) {
        d.endDate = a[i + 1] ? a[i + 1].date : today;
        d.dateRange = d.endDate - d.date;
        if (!maxDateRange || d.dateRange > maxDateRange)
            maxDateRange = d.dateRange;
    });

    var xscale = d3.scale.linear()
        .domain([0, maxDateRange])
        .range([0, width - padding.right - padding.left]);

    var xaxis = d3.svg.axis()
        .orient("top")
        .scale(xscale)
        .tickFormat(function(d) { return Math.floor(d * 1.15741e-8) + " days"; });

    var barHeight = (height - padding.top - padding.bottom) / kegPurchases.length;

    var svg = kegLife.append("svg")
        .attr("width", width)
        .attr("height", height);

    var bar = svg.selectAll("g.bar").data(kegPurchases);
    bar.enter().append("g")
        .attr("class", "bar");
    bar
        .attr("transform", function(d, i) {
            return "translate(" + padding.left + "," + (i * barHeight + padding.top) + ")";
        })
    bar.append("rect")
        .attr("width", function(d) { return xscale(d.dateRange); })
        .attr("height", barHeight)
        .style("fill", function(d) { return data["beers"][d.beer].color; });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + padding.left + "," + padding.top + ")")
        .call(xaxis);
}


d3.json("../data/the-beer-tree.json", function(error, data) {
    data["purchases"].forEach(function(d) {
        d.date = parseDate.parse(d.date);
    });
    buildKegLife(data);
});

var w = 1120,
    h = 600,
    x = d3.scale.linear(),
    y = d3.scale.linear().range([0, h]);

var svg = d3.select("#wc2010").append("div")
    .attr("class", "chart")
    .style("width", w + "px")
    .style("height", h + "px")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h);

var partition = d3.layout.partition()
    .value(function(d) { return d.children ? d.children.length : 1; });

d3.json("../data/world-cup-2010-bracket.json", function(root) {
    var nodes = partition.nodes(root);

    var kx = w / root.dx,
        ky = h / 1;

    x.range([w - root.dy * kx, -root.dy * kx]);

    var g = svg.selectAll("g")
            .data(nodes)
        .enter().append("svg:g")
            .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });

    g.append("svg:rect")
        .attr("width", root.dy * kx)
        .attr("height", function(d) { return d.dx * ky; })
        .attr("class", function(d) { 
            var klass = "";
            if (d.parent) {
                if (d.parent.name == d.name)
                {
                    klass += "winner";
                }
                else
                {
                    klass += "loser";
                }
            }
            else
            {
                klass += "champion";
            }
            if (d.children)
            {
                klass += " parent";
            }
            return klass
        })
        .on("mouseover", mouseoverTeam)
        .on("mouseout", mouseoutTeam);

    g.append("svg:text")
        .attr("transform", transform)
        .attr("dy", ".35em")
        .text(function(d) { return d.name; })

    function transform(d) {
        return "translate(8," + d.dx * ky / 2 + ")";
    }
});


function mouseoverTeam() {
    var team = d3.select(this);
    d3.selectAll("rect")
        .filter(function(r) { return r.name == team.datum().name; })
        .classed("focused", true);
}


function mouseoutTeam() {
    var team = d3.select(this);
    d3.selectAll("rect")
        .filter(function(r) { return r.name == team.datum().name; })
        .classed("focused", false);
}

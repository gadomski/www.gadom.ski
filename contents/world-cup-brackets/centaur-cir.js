var body = d3.select("body");

var width = 714,
    height = 500;

var partition = d3.layout.partition()
    .value(function(d) { return d.children ? d.children.length : 1; });


function assignScores(results, bracket) {
    results.losers = [];
    bracket.status = "undecided";
    if (results.children) {
        var rc0 = results.children[0],
            rc1 = results.children[1],
            bc0 = bracket.children[0],
            bc1 = bracket.children[1];
        assignScores(rc0, bc0);
        assignScores(rc1, bc1);
        bracket.score = bc0.score + bc1.score;
        bracket.possibleScore = bc0.possibleScore + bc1.possibleScore;
        results.losers.push.apply(results.losers, rc0.losers);
        results.losers.push.apply(results.losers, rc1.losers);
        if (results.name === "")
        {
            if (results.losers.indexOf(bracket.name) === -1)
            {
                bracket.possibleScore += scoreFromDepth(bracket.depth);
            }
            else
            {
                bracket.status = "incorrect";
            }
        }
        else if (results.name == bracket.name)
        {
            bracket.score += scoreFromDepth(bracket.depth);
            bracket.possibleScore += scoreFromDepth(bracket.depth);
            bracket.status = "correct";
        }
        else
        {
            results.losers.push(bracket.name);
            bracket.winner = results.name;
            bracket.status = "incorrect";
        }
    }
    else
    {
        bracket.score = 0;
        bracket.possibleScore = 0;
    }
}


function scoreFromDepth(depth) {
    return Math.pow(2, 3 - depth);
}


function buildBrackets(trees) {
    var brackets = d3.select("#brackets");

    brackets.append("h2").text("Standings");
    brackets.append("ol").selectAll(".standing")
            .data(trees)
        .enter().append("li")
        .attr("class", "standing")
        .append("a")
        .attr("href", function(d) { return "#" + d.owner; })
        .html(function(d) {
            return d.owner + " &mdash; " + d.score + " " + pluralize("points", d.score) + ", " + d.possibleScore + " possible";
        });


    var x = d3.scale.linear(),
        y = d3.scale.linear().range([0, height]);

    var bracket = brackets.selectAll(".bracket").data(trees);

    bracket.enter()
        .append("div")
        .attr("class", "bracket");

    bracket.append("h2")
        .attr("id", function(d) { return d.owner; })
        .text(function(d, i) { return "#" + String(i+1) + ": " + d.owner; })
        .style("margin-top", "2em");

    bracket.append("p").text(function(d) {
        return String(d.score) + " " + pluralize("point", d.score) + ", maximum possible is " + String(d.possibleScore);
    });

    var svg = bracket.append("svg")
        .attr("width", width)
        .attr("height", height);

    var g = svg.selectAll("g").data(function(d) { return partition.nodes(d); });

    x.range([width - 0.2 * width,  -0.2 * width]);

    g.enter().append("g")
        .attr("transform", function(d) {
            return "translate(" + x(d.y) + "," + y(d.x) + ")";
        })
        .attr("class", function(d) {
            if (d.children)
                return d.status;
            else
                return "leaf";
        });

    g.append("rect")
        .attr("width", 0.2 * width)
        .attr("height", function(d) { return d.dx * height; })
        
    var text = g.append("text")
        .attr("transform", transform)
        .attr("dy", "0.35em")
        .attr("font-size", "12px")
        .each(function(d) {
            var name = d3.select(this).append("tspan")
                .text(function(d) { return d.name; })
                .attr("x", 0);
            if (d.status === "incorrect")
            {
                name.attr("text-decoration", "line-through");
                if (d.winner) {
                    d3.select(this).append("tspan")
                        .text(d.winner)
                        .attr("x", 0)
                        .attr("dy", "1.2em");
                }
            }
        });

    function transform(d) {
        return "translate(8," + d.dx * height / 2 + ")";
    }
}


var results = {
    "name": "",
    "children": [
    {
        "name": "",
        "children": [
        {
            "name": "",
            "children": [
            {
                "name": "Brazil",
                "children": [
                {"name": "Brazil"},
                {"name": "Chile"}
                ]
            },
            {
                "name": "Columbia",
                "children": [
                {"name": "Columbia"},
                {"name": "Uruguay"}
                ]
            }
            ]
        },
        {
            "name": "",
            "children": [
            {
                "name": "France",
                "children": [
                {"name": "France"},
                {"name": "Nigeria"}
                ]
            },
            {
                "name": "Germany",
                "children": [
                {"name": "Germany"},
                {"name": "Algeria"}
                ]
            }
            ]
        }
        ]
    },
    {
        "name": "",
        "children": [
        {
            "name": "",
            "children": [
            {
                "name": "Netherlands",
                "children": [
                {"name": "Netherlands"},
                {"name": "Mexico"}
                ]
            },
            {
                "name": "Costa Rica",
                "children": [
                {"name": "Costa Rica"},
                {"name": "Greece"}
                ]
            }
            ]
        },
        {
            "name": "",
            "children": [
            {
                "name": "Argentina",
                "children": [
                {"name": "Argentina"},
                {"name": "Switzerland"}
                ]
            },
            {
                "name": "Belgium",
                "children": [
                {"name": "Belgium"},
                {"name": "USA"}
                ]
            }
            ]
        }
        ]
    }
    ]
};


var brackets = [
{
    "owner": "Nick",
        "name": "Belgium",
        "third": "Brazil",
        "children": [
        {
            "name": "Brazil",
            "children": [
            {
                "name": "Brazil",
                "children": [
                {
                    "name": "Brazil",
                    "children": [
                    {"name": "Brazil"},
                    {"name": "Chile"}
                    ]
                },
                {
                    "name": "Uruguay",
                    "children": [
                    {"name": "Columbia"},
                    {"name": "Uruguay"}
                    ]
                }
                ]
            },
            {
                "name": "Germany",
                "children": [
                {
                    "name": "Nigeria",
                    "children": [
                    {"name": "France"},
                    {"name": "Nigeria"}
                    ]
                },
                {
                    "name": "Germany",
                    "children": [
                    {"name": "Germany"},
                    {"name": "Algeria"}
                    ]
                }
                ]
            }
            ]
        },
        {
            "name": "Belgium",
            "children": [
            {
                "name": "Netherlands",
                "children": [
                {
                    "name": "Netherlands",
                    "children": [
                    {"name": "Netherlands"},
                    {"name": "Mexico"}
                    ]
                },
                {
                    "name": "Costa Rica",
                    "children": [
                    {"name": "Costa Rica"},
                    {"name": "Greece"}
                    ]
                }
                ]
            },
            {
                "name": "Belgium",
                "children": [
                {
                    "name": "Argentina",
                    "children": [
                    {"name": "Argentina"},
                    {"name": "Switzerland"}
                    ]
                },
                {
                    "name": "Belgium",
                    "children": [
                    {"name": "Belgium"},
                    {"name": "USA"}
                    ]
                }
                ]
            }
            ]
        }
    ]
},
{
    "owner": "Jean",
    "third": "Brazil",
    "name": "Germany",
    "children": [
    {
        "name": "Germany",
        "children": [
        {
            "name": "Brazil",
            "children": [
            {
                "name": "Brazil",
                "children": [
                {"name": "Brazil"},
                {"name": "Chile"}
                ]
            },
            {
                "name": "Uruguay",
                "children": [
                {"name": "Columbia"},
                {"name": "Uruguay"}
                ]
            }
            ]
        },
        {
            "name": "Germany",
            "children": [
            {
                "name": "Nigeria",
                "children": [
                {"name": "France"},
                {"name": "Nigeria"}
                ]
            },
            {
                "name": "Germany",
                "children": [
                {"name": "Germany"},
                {"name": "Algeria"}
                ]
            }
            ]
        }
        ]
    },
    {
        "name": "Argentina",
        "children": [
        {
            "name": "Greece",
            "children": [
            {
                "name": "Netherlands",
                "children": [
                {"name": "Netherlands"},
                {"name": "Mexico"}
                ]
            },
            {
                "name": "Greece",
                "children": [
                {"name": "Costa Rica"},
                {"name": "Greece"}
                ]
            }
            ]
        },
        {
            "name": "Argentina",
            "children": [
            {
                "name": "Argentina",
                "children": [
                {"name": "Argentina"},
                {"name": "Switzerland"}
                ]
            },
            {
                "name": "USA",
                "children": [
                {"name": "Belgium"},
                {"name": "USA"}
                ]
            }
            ]
        }
        ]
    }
    ]
},
{
    "owner": "Pete",
    "third": "Brazil",
    "name": "Germany",
    "children": [
    {
        "name": "Germany",
        "children": [
        {
            "name": "Brazil",
            "children": [
            {
                "name": "Brazil",
                "children": [
                {"name": "Brazil"},
                {"name": "Chile"}
                ]
            },
            {
                "name": "Uruguay",
                "children": [
                {"name": "Columbia"},
                {"name": "Uruguay"}
                ]
            }
            ]
        },
        {
            "name": "Germany",
            "children": [
            {
                "name": "France",
                "children": [
                {"name": "France"},
                {"name": "Nigeria"}
                ]
            },
            {
                "name": "Germany",
                "children": [
                {"name": "Germany"},
                {"name": "Algeria"}
                ]
            }
            ]
        }
        ]
    },
    {
        "name": "Argentina",
        "children": [
        {
            "name": "Costa Rica",
            "children": [
            {
                "name": "Netherlands",
                "children": [
                {"name": "Netherlands"},
                {"name": "Mexico"}
                ]
            },
            {
                "name": "Costa Rica",
                "children": [
                {"name": "Costa Rica"},
                {"name": "Greece"}
                ]
            }
            ]
        },
        {
            "name": "Argentina",
            "children": [
            {
                "name": "Argentina",
                "children": [
                {"name": "Argentina"},
                {"name": "Switzerland"}
                ]
            },
            {
                "name": "Belgium",
                "children": [
                {"name": "Belgium"},
                {"name": "USA"}
                ]
            }
            ]
        }
        ]
    }
    ]
},
{
    "owner": "Kelly",
    "third": "Argentina",
    "name": "Costa Rica",
    "children": [
    {
        "name": "France",
        "children": [
        {
            "name": "Columbia",
            "children": [
            {
                "name": "Brazil",
                "children": [
                {"name": "Brazil"},
                {"name": "Chile"}
                ]
            },
            {
                "name": "Columbia",
                "children": [
                {"name": "Columbia"},
                {"name": "Uruguay"}
                ]
            }
            ]
        },
        {
            "name": "France",
            "children": [
            {
                "name": "France",
                "children": [
                {"name": "France"},
                {"name": "Nigeria"}
                ]
            },
            {
                "name": "Germany",
                "children": [
                {"name": "Germany"},
                {"name": "Algeria"}
                ]
            }
            ]
        }
        ]
    },
    {
        "name": "Costa Rica",
        "children": [
        {
            "name": "Costa Rica",
            "children": [
            {
                "name": "Netherlands",
                "children": [
                {"name": "Netherlands"},
                {"name": "Mexico"}
                ]
            },
            {
                "name": "Costa Rica",
                "children": [
                {"name": "Costa Rica"},
                {"name": "Greece"}
                ]
            }
            ]
        },
        {
            "name": "Argentina",
            "children": [
            {
                "name": "Argentina",
                "children": [
                {"name": "Argentina"},
                {"name": "Switzerland"}
                ]
            },
            {
                "name": "USA",
                "children": [
                {"name": "Belgium"},
                {"name": "USA"}
                ]
            }
            ]
        }
        ]
    }
    ]
}
];

brackets.forEach(function(b) {
    partition.nodes(b);
    assignScores(results, b);
});
brackets.sort(function(a, b) {
    var scoreDiff = b.score - a.score;
    return scoreDiff != 0 ? scoreDiff : b.possibleScore - a.possibleScore;
});
buildBrackets(brackets);

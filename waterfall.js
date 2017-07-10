// Setup
var screenW = window.screen.width
  , margin = {top: 20, right: 30, bottom: 150, left: 70}
  , width = Math.floor(screenW * 2 / 3) - margin.left - margin.right
  , height = 700 - margin.top - margin.bottom
  , padding = 0.3
  , dataPaneWidth = Math.floor(screenW / 3) - 15
  ;

var chart = d3.select(".chart")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var dataPane = $("#data-pane");
dataPane.css("width", dataPaneWidth + "px");


function reloadGraph () {
  var prefix = $("#prefix").val(), suffix = $("#suffix").val();
  function formatter(n) { return prefix + Math.round(n) + suffix; }

  var data = $("#data")[0].value.trim();
  data = Papa.parse(data, { header: true, skipEmptyLines: true, delimiter: "," }).data;
  data.forEach(function(d) { d.value = parseFloat(d.value); });


  // Transform data (i.e., finding cumulative values and total) for easier charting
  var cumulative = 0, maxValue = 0, minValue = 0;
  for (var i = 0; i < data.length; i++) {
    if (data[i].type === "total") {
      if (isNaN(data[i].value)) { data[i].value = cumulative; }
      data[i].start = 0;
      data[i].end = data[i].value;
      cumulative = data[i].value;
      data[i].class = "total";
    } else {
      data[i].start = cumulative;
      cumulative += data[i].value;
      data[i].end = cumulative;
      data[i].class = ( data[i].value >= 0 ) ? 'positive' : 'negative'
    }

    if (maxValue < cumulative) { maxValue = cumulative; }
    if (minValue > cumulative) { minValue = cumulative; }
  }

  data[data.length - 1].lastBar = true;

  minValue *= 1.1;
  maxValue *= 1.1;

  var x = d3.scale.ordinal()
      .domain(data.map(function(d) { return d.name; }))
      .rangeRoundBands([0, width], padding);

  var y = d3.scale.linear()
      .domain([minValue, maxValue])
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");


  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(function(d) { return formatter(d); });

  chart.selectAll("*").remove();

  chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
        .selectAll(".tick").selectAll("text")
        .remove()


  chart.selectAll(".tick")
      .append("foreignObject").attr("x", -x.rangeBand() / 2).attr("width", x.rangeBand())
      .attr("y", 10).attr("height", 150)
      .append("xhtml:div")
      .text(function (d) { return d; })

  chart.append("g").attr("class", "axis")
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(0))
      .attr("y2", y(0))
      ;

  chart.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  var bar = chart.selectAll(".bar")
      .data(data)
      .enter().append("g")
      .attr("class", function(d) { return "bar " + d.class })
      .attr("transform", function(d) { return "translate(" + x(d.name) + ",0)"; });

  bar.append("rect")
      .attr("y", function(d) { return y( Math.max(d.start, d.end) ); })
      .attr("height", function(d) { return Math.abs( y(d.start) - y(d.end) ); })
      .attr("width", x.rangeBand());

  bar.append("text")
      .attr("x", x.rangeBand() / 2)
      .attr("y", function(d) { return y(d.end) + 5; })
      .attr("dy", function(d) { return ((d.class === 'negative' || (d.class === 'total' && d.value < 0)) ? '-' : '') + ".75em"; })
      .text(function(d) { return formatter(d.end - d.start);});

  bar.filter(function(d) { return !d.lastBar; }).append("line")
      .attr("class", "connector")
      .attr("x1", x.rangeBand() + 5 )
      .attr("y1", function(d) { return y(d.end) } )
      .attr("x2", x.rangeBand() / ( 1 - padding) - 5 )
      .attr("y2", function(d) { return y(d.end) } )
}

// Init
reloadGraph();


// Reload graph when data changes
$("#prefix").on("keyup", reloadGraph);
$("#suffix").on("keyup", reloadGraph);
$("#data").on("keyup", reloadGraph);





$(document).ready(function () {
    // adapted from http://bl.ocks.org/peterssonjonas/4a0e7cb8d23231243e0e

    var container_selector = "div#comparison-scatter",
        xlabel_selector = '#xlabel',
        ylabel_selector = '#ylabel',
        label_description_selector = "#label-description";

    // make sure we have a container to work with, otherwise abort
    if ($(container_selector).length < 1) {
        return;
    }

    var margin = {top: 0, right: 0, bottom: 40, left: 60},
        outerWidth = 600,
        outerHeight = 400,
        width = outerWidth - margin.left - margin.right,
        height = outerHeight - margin.top - margin.bottom;

    var dot_size = 8,
        // color = '#078930';
        color = '#006400';

    var idKey = "model",
        xKey = null,
        yKey = null;

    var g = null,
        xAxis = null,
        yAxis = null;

    var x = null,
        y = null;

    var svg = d3.select(container_selector)
        .append("svg")
        .attr("width", outerWidth)
        .attr("height", outerHeight)
        .attr("fill", "white");

    function zoom() {
        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);

        svg.selectAll(".dot")
            .attr("transform", transform)
            .attr("r", dot_size * d3.event.scale);
    }

    function transform(d) {
        return "translate(" + x(d[xKey]) + "," + y(d[yKey]) + ")";
    }

// from http://bl.ocks.org/williaster/10ef968ccfdc71c30ef8
// Handler for dropdown value change
    var updatePlot = function () {
        xKey = $(xlabel_selector).prop('value') + "-score";
        yKey = $(ylabel_selector).prop('value') + "-score";
        var xName = $(xlabel_selector).find('option:selected').text(),
            yName = $(ylabel_selector).find('option:selected').text();
        $(label_description_selector).html(xName + ' <span>vs</span> ' + yName);


        d3.selectAll("svg > *").remove();

        // tip
        var tip = d3.tip()
            .attr("class", "d3-tip")
            .offset([-10, 0])
            .html(function (d) {
                return "<strong>" + d[idKey] + "</strong><br>" +
                    xKey + ": " + d[xKey] + "<br>" +
                    yKey + ": " + d[yKey];
            });

        svg.call(tip);

        // filter data to guard against empty "" or "X" scores turning into NaNs that mess up d3
        var filtered_data = comparison_data.filter(row =>
            row[xKey].length > 0 && !isNaN(row[xKey]) &&
            row[yKey].length > 0 && !isNaN(row[yKey]));

        // axes range
        var xMax = d3.max(filtered_data, function (d) {
                return d[xKey];
            }) * 1.05,
            xMin = d3.min(filtered_data, function (d) {
                return d[xKey];
            }) * .95,
            yMax = d3.max(filtered_data, function (d) {
                return d[yKey];
            }) * 1.05,
            yMin = d3.min(filtered_data, function (d) {
                return d[yKey];
            }) * .95;

        x = d3.scale.linear()
            .range([0, width]).nice();

        y = d3.scale.linear()
            .range([height, 0]).nice();

        x.domain([xMin, xMax]);
        y.domain([yMin, yMax]);

        // zoom
        var zoomBeh = d3.behavior.zoom()
            .x(x)
            .y(y)
            .scaleExtent([0, 500])
            .on("zoom", zoom);

        g = svg
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoomBeh);

        // axes
        xAxis = d3.svg.axis()
            .scale(x)
            .ticks(5)
            .orient("bottom")
            .tickSize(-height);

        yAxis = d3.svg.axis()
            .scale(y)
            .ticks(3)
            .orient("left")
            .tickSize(-width);

        g.append("rect")
            .attr("width", width)
            .attr("height", height);

        g.append("g")
            .classed("x axis", true)
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)

            // For the x-axis label
            .append("text")
            .attr("class", "label")
            .attr("x", width / 2)
            .attr("y", 35)
            .style("text-anchor", "middle")
            .style("fill", "black")  
            .text(xName
                .replace(/([a-z])([A-Z])/g, '$1 $2')  // Adds space before capital letters in camel case
                .replace(/([a-zA-Z])(\d+)/g, '$1 $2')  // Adds space between letters and following digits
                .replace(/(\d+)([a-zA-Z])/g, '$1 $2')  // Adds space between digits and following letters
                .replace(/[_-]/g, ' '));  // Replace all '_' and '-' with spaces

        // Set tick text color to black for both axes
        svg.selectAll(".x.axis text")  
        .style("fill", "black");  

        g.append("g")
            .classed("y axis", true)
            .call(yAxis)

            // For the y-axis label
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("dy", ".71em")
            .style("text-anchor", "middle")
            .style("fill", "black")  // Set label text color to black
            .text(yName
                .replace(/([a-z])([A-Z])/g, '$1 $2')  // Adds space before capital letters in camel case
                .replace(/([a-zA-Z])(\d+)/g, '$1 $2')  // Adds space between letters and following digits
                .replace(/(\d+)([a-zA-Z])/g, '$1 $2')  // Adds space between digits and following letters
                .replace(/[_-]/g, ' '));  // Replace all '_' and '-' with spaces

        svg.selectAll(".y.axis text") 
        .style("fill", "black");  

         

        // create svg objects
        var objects = g.append("svg")
            .classed("objects", true)
            .attr("width", width)
            .attr("height", height);

        // fill svg with data and position
        objects.selectAll(".dot")
            .data(filtered_data)
            .enter().append("circle")
            .classed("dot", true)
            .attr("r", dot_size)
            .attr("transform", transform)
            .style("fill", color)
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide);
    };

    $(xlabel_selector + ', ' + ylabel_selector)
        .on("change", updatePlot);

    updatePlot();
});

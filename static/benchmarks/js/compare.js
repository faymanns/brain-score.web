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
        color = '#078930';

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

    function updateRegressionLine() {
        // Filter data to guard against empty "" or "X" scores turning into NaNs
        var filtered_data = comparison_data.filter(row =>
            row[xKey].length > 0 && !isNaN(row[xKey]) &&
            row[yKey].length > 0 && !isNaN(row[yKey]));
        
                // Calculate the correlation
        var xValues = filtered_data.map(d => +d[xKey]);
        var yValues = filtered_data.map(d => +d[yKey]);

        const { slope, intercept } = calculateLinearRegression(xValues, yValues);

        // Calculate line endpoints within the current x-axis range
        const xStart = x.domain()[0];
        const xEnd = x.domain()[1];
        const yStart = slope * xStart + intercept;
        const yEnd = slope * xEnd + intercept;

        // Update the regression line with the new start and end points
        svg.select(".regression-line")
            .attr("x1", x(xStart))
            .attr("y1", y(yStart))
            .attr("x2", x(xEnd))
            .attr("y2", y(yEnd));
    }

    function zoom() {
        svg.select(".x.axis").call(xAxis);
        svg.select(".y.axis").call(yAxis);

        svg.selectAll(".dot")
            .attr("transform", transform)
            .attr("r", dot_size);
        // Update the regression line based on zoom
        updateRegressionLine();
    }

    function transform(d) {
        return "translate(" + x(d[xKey]) + "," + y(d[yKey]) + ")";
    }

    // Function to make a string human-readable
    function humanReadable(text) {
        return text
            .replace(/([a-z])([A-Z])/g, '$1 $2')  // Adds space before capital letters in camel case
            .replace(/(\b[a-zA-Z]+)(\d+)(?!V1\b)/g, '$1 $2')  // Adds space between letters and digits, ignoring "V1"
            .replace(/(\d+)([a-zA-Z])(?!V1\b)/g, '$1 $2')  // Adds space between digits and letters, ignoring "V1"
            .replace(/[_]/g, ' ')  // Replace all '_' with spaces
            .replace(/[-]/g, ' - ');  // Replace all '-' with ' - '
    }


    // Calculate Pearson correlation coefficient, R^2, and p-value
    function calculateCorrelation(xArr, yArr) {
        const n = xArr.length;
        const sumX = xArr.reduce((a, b) => a + b, 0);
        const sumY = yArr.reduce((a, b) => a + b, 0);
        const sumXY = xArr.map((xi, i) => xi * yArr[i]).reduce((a, b) => a + b, 0);
        const sumX2 = xArr.map(xi => xi * xi).reduce((a, b) => a + b, 0);
        const sumY2 = yArr.map(yi => yi * yi).reduce((a, b) => a + b, 0);

        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

        const correlation = denominator === 0 ? 0 : numerator / denominator;
        const rSquared = correlation * correlation;  // Calculate R^2

        // // Calculate the t-statistic
        const tStatistic = correlation * Math.sqrt((n - 2) / (1 - rSquared));
        
        // // Calculate the p-value (2-tailed) using jStat's cumulative distribution function
        const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStatistic), n - 2));

        return { correlation, rSquared, pValue };  // Return correlation, R^2, and p-value
    }


    // Calculate Linear Regression Slope and Intercept
    function calculateLinearRegression(xArr, yArr) {
        const n = xArr.length;
        const sumX = xArr.reduce((a, b) => a + b, 0);
        const sumY = yArr.reduce((a, b) => a + b, 0);
        const sumXY = xArr.map((xi, i) => xi * yArr[i]).reduce((a, b) => a + b, 0);
        const sumX2 = xArr.map(xi => xi * xi).reduce((a, b) => a + b, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        return { slope, intercept };
    }


    // Define the SVG and clip path
    svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width)
        .attr("height", height);

    var updatePlot = function () {
        xKey = $(xlabel_selector).prop('value') + "-score";
        yKey = $(ylabel_selector).prop('value') + "-score";

        var xName = humanReadable($(xlabel_selector).find('option:selected').text());
        var yName = humanReadable($(ylabel_selector).find('option:selected').text());

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


        // Calculate the correlation
        var xValues = filtered_data.map(d => +d[xKey]);
        var yValues = filtered_data.map(d => +d[yKey]);
        var { correlation, rSquared, pValue } = calculateCorrelation(xValues, yValues);


        // Calculate regression line
        var { slope, intercept } = calculateLinearRegression(xValues, yValues);
        // Define the endpoints for the line
        var xStart = d3.min(xValues);
        var xEnd = d3.max(xValues);
        var yStart = slope * xStart + intercept;
        var yEnd = slope * xEnd + intercept;

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

        var zoomBeh = d3.behavior.zoom()
            .x(x)
            .y(y)
            .scaleExtent([0, 500])
            .on("zoom", zoom);

        g = svg
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("clip-path", "url(#clip)")  // Apply clip path here
            .call(zoomBeh);

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
            .append("text")
            .attr("class", "label")
            .attr("x", width / 2)
            .attr("y", 35)
            .style("text-anchor", "middle")
            .style("fill", "black")
            .text(xName);  // Use the human-readable xName here

        svg.selectAll(".x.axis text")  
            .style("fill", "black");

        g.append("g")
            .classed("y axis", true)
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("dy", ".71em")
            .style("text-anchor", "middle")
            .style("fill", "black")
            .text(yName);  // Use the human-readable yName here

        svg.selectAll(".y.axis text") 
            .style("fill", "black");

        // Correlation plotting
        g.append("text")
            .attr("class", "correlation-text")
            .attr("x", width - 50)  // Positioning it towards the top-right corner
            .attr("y", 20)
            .attr("text-anchor", "end")
            .attr("fill", "black")
            .style("font-size", "16px")
            .text("Pearson R: " + correlation.toFixed(2));

        g.append("text")
            .attr("class", "r2-text")
            .attr("x", width - 50)  // Positioning it towards the top-right corner
            .attr("y", 40)          // Adjust y-position to be below the correlation text
            .attr("text-anchor", "end")
            .attr("fill", "black")
            .style("font-size", "16px")
            .text("R²: " + rSquared.toFixed(2));

        g.append("text")
            .attr("class", "r2-text")
            .attr("x", width - 50)  // Positioning it towards the top-right corner
            .attr("y", 60)          // Adjust y-position to be below the correlation text
            .attr("text-anchor", "end")
            .attr("fill", "black")
            .style("font-size", "16px")
            .text(() => {
                // Format p-value conditionally
                return pValue >= 0.01 
                    ? `p-value: ${pValue.toFixed(2)}`  // Show two decimal places
                    : `p-value: ${pValue.toExponential(1).replace(/^(\d)\.?\d*e/, '$1 × 10^')}`; // Exponential format with 1 digit
            });

        // plotting the line
        g.append("line")
            .attr("class", "regression-line")
            .attr("x1", x(xStart))
            .attr("y1", y(yStart))
            .attr("x2", x(xEnd))
            .attr("y2", y(yEnd))
            .attr("stroke-width", 2)
            .attr("stroke", "lightgrey")
            .attr("stroke-dasharray", "4,4")
            .attr("clip-path", "url(#clip)");  // Ensure line is also clipped


        var objects = g.append("svg")
            .classed("objects", true)
            .attr("width", width)
            .attr("height", height);

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

    $('#xlabel').select2({
        placeholder: "Select or type",
        tags: true,
        allowClear: true
    });
    $('#ylabel').select2({
        placeholder: "Select or type",
        tags: true,
        allowClear: true
    });

    function setDropdownValue(xName, yName) {
        $("#xlabel").val(xName);
        $("#xlabel").trigger("change");
        $("#ylabel").val(yName);
        $("#ylabel").trigger("change");
        updatePlot();
        // const element = document.getElementById("controls-container");
        // element.scrollIntoView({ behavior: "smooth" });
    };

    $("details").click(function() {
        $("details").not(this).removeAttr("open");
        if (this.id == "objectClassification") {
            setDropdownValue("ImageNet-top1_v1", "average_vision_v0");
        } else if (this.id == "alignmnetV1") {
            setDropdownValue("FreemanZiemba2013.V1-pls_v2", "ImageNet-C-top1_v0`");
        } else if (this.id == "V1likeProperties"){
            setDropdownValue("Marques2020_v0", "Rajalingham2018-i2n_v2");
        }
    });

});

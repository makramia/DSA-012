function f1() {
  var WholeData = [];
  var newData = [];
  var dropdown_data = [];

  d3.csv("/dataset/Population-EstimatesData.csv").then((wide_data) => {

    wide_data.forEach(function (row) {
      // Loop through all of the columns, and for each column
      // make a new row
      Object.keys(row).forEach(function (colname) {
        // Ignore 'State' and 'Value' columns
        if (colname == "Country Name" || colname == "Country Code" ||
          colname == "Indicator Name" || colname == "Indicator Code") {

          return
        }
        WholeData.push({
          "Country_Name": row["Country Name"], "Country_Code": row["Country Code"], "Indicator_Name": row["Indicator Name"],
          "Indicator_Code": row["Indicator Code"], "Value": row[colname], "Year": colname
        });
      })

    })


    newData = d3.group(WholeData, (d) => d.Country_Name, (d) => d.Indicator_Name)
    newData = newData.get("Saudi Arabia").get("Population, total")
    newData = d3.filter(newData, (d) => (2000 <= d.Year && d.Year <= 2030))

    dropdown_data = [...d3.group(WholeData, d => d['Country_Name']).keys()]
    makeVis(newData);

  });




  function makeVis(data) {

    // set the dimensions and margins of the graph

    margin = { top: 60, right: 30, bottom: 30, left: 60 };
    const width = 890 - margin.left - margin.right;
    const height = 490 - margin.top - margin.bottom;

    // Make x scale
    var xScale = d3.scaleBand()
      .domain(data.map(d => d.Year))
      .range([0, width])
      .padding(.1);

    // Make y scale, the domain will be defined on bar update
    const formater = d3.format("~s")

    format = function (n) {
      const formatted = d3.format('.3s')(n)
      return formatted.replace('G', 'B');
    }
    var yScale = d3.scaleLinear()
      .range([height, 0]);

    // Create svg
    const svg = d3.select("#container1")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom + 20 + "px")
      .append("g");
      //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Make x-axis and add to canvas
    var xAxis = d3.axisBottom()
      .scale(xScale);


    svg.append('g')
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis.tickSize(5).tickSizeOuter(0));


    // Make y-axis and add to canvas
    var yAxis = d3.axisLeft()
      .scale(yScale);

    var yAxisHandleForUpdate = svg.append("g")
      .attr("class", "y axis")
      .call(yAxis.tickSize(0).tickPadding(6).tickFormat(format));

    // set horizontal grid line
    var GridLine = () => d3.axisLeft().scale(yScale);
    svg
      .append("g")
      .attr("class", "grid")
      .call(GridLine()
        .tickSize(-width, 0, 0)
        .tickFormat("")
      );

    // create a tooltip
    const tooltip = d3.select("#container1")
      .append("div")
      .attr("id", "tooltip1")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("padding", "15px")
      .style("background", "rgba(0,0,0,0.5)")
      .style("border-radius", "5px")
      .style("color", "#fff");

    // tolltip events
    const mouseover = function (d) {
      tooltip
        .style("opacity", .8);
      d3.select(this)
        .style("opacity", .5);
    }

    const mousemove = function (event, d) {

      tooltip
        .html("Population: " + format(d.Value))
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    }

    const mouseleave = function (d) {
      tooltip
        .style("opacity", 0);
      d3.select(this)
        .style("opacity", 1);
    }

    var updateBars = function (data) {
      // First update the y-axis domain to match data
      yScale.domain([d3.min(data, d => +d.Value), d3.max(data, d => +d.Value)]).nice()
      yAxisHandleForUpdate.call(yAxis.tickSize(0).tickPadding(6).tickFormat(format));

      let t = svg.transition().duration(250);
      var bars = svg.selectAll("rect")
        .data(data)
        .join(enter => enter.append("rect")
          .attr("class", "bar")
          .attr("fill", "#0072BC")
          .attr("x", d => xScale(d.Year))
          .attr("y", d => yScale(d.Value))
          .attr("width", xScale.bandwidth())
          .attr("height", d => height - yScale(d.Value))
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseleave", mouseleave),
          update => update.call(update => update.transition(t)
            .attr("y", d => yScale(d.Value))
            .attr("height", d => height - yScale(d.Value))),
          exit => exit.call(exit => exit.transition(t)
            .attr("y", 0)
            .attr("height", 0)
            .remove())
        )
        .append("g");

    };

    updateBars(data);


    // set title
    svg
      .append("text")
      .attr("class", "chart-title")
      .attr("x", -(margin.left) * 0.9)
      .attr("y", -(margin.top) / 1.5)
      .attr("text-anchor", "start")
      .text("Total Population Estimate | 2000 - 2030")

    // set Y axis label
    svg
      .append("text")
      .attr("class", "chart-label")
      .attr("x", -(margin.left) * 0.9)
      .attr("y", -(margin.top / 4))
      .attr("text-anchor", "start")
      .text("Population (millions)")

    // set source
    svg
      .append("text")
      .attr("class", "chart-source")
      .attr("x", (margin.left) * 0.1 )
      .attr("y", height + margin.bottom + 5)
      .attr("top-padding", 5 + "px")
      .attr("text-anchor", "start")
      .text("Source: World Bank Open Data")

    // set copyright
    svg
      .append("text")
      .attr("class", "copyright")
      .attr("x", (margin.left) * 0.1)
      .attr("y", height + margin.bottom + 15)
      .attr("top-padding", 5 + "px")
      .attr("text-anchor", "start")
      .text("© 2023 The World Bank Group.")


    // Handler for dropdown value change
    var dropdownChange = function () {
      var newCountry = d3.select(this).property('value')
      newData = d3.group(WholeData, (d) => d.Country_Name, (d) => d.Indicator_Name)

      newData = newData.get(newCountry).get("Population, total")
      newData = d3.filter(newData, (d) => (2000 <= d.Year && d.Year <= 2030))



      updateBars(newData);


    };

    var dropdown = d3.select("#container1")
      .insert("select", "svg")
      .attr("margin-left", margin.left)
      .on("change", dropdownChange);

    dropdown.selectAll("option")
      .data(dropdown_data)
      .enter().append("option")
      .attr("value", function (d) { return d; })
      .property("selected", function (d) { return d === "Saudi Arabia"; })
      .text(function (d) {
        return d[0].toUpperCase() + d.slice(1, d.length); // capitalize 1st letter
      });

  };

}

f1();


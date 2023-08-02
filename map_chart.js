function f5() {
  //set svg parameters
  const width = 900
  const height = 350

  const svg = d3.select("#container5")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", "0 0  900 400")
    .attr("preserveAspectRatio", "xMinYMin");

  const map_svg = d3.select("#map")
    .append("svg")
    .attr("width", "750")
    .attr("height", "350")
    .attr("viewBox", "0 0  750 400")
    .attr("preserveAspectRatio", "xMinYMin");

  const color_legend_svg = d3.select("#color-legend")
    .append("svg")
    .attr("width", "150")
    .attr("height", "350")
    .attr("viewBox", "0 0  150 250")
    .attr("preserveAspectRatio", "xMinYMin");

  //set map scale, location on screen and its projection
  const projection = d3.geoRobinson()
    .scale(100)
    .center([0, 0])
    .translate([width / 2.2, height / 2]);

  //path generator
  const generator = d3.geoPath()
    .projection(projection);

  //declare polygon, polyline and bubble
  // const poly = svg.append("g");
  // const line = svg.append("g");
  // const bubble = svg.append("g");

  const poly = map_svg.append("g");
  const line = map_svg.append("g");
  const bubble = map_svg.append("g");

  // declare URL
  const dataURL = "dataset/global_power_plant_database.csv"
  const polygonsURL = "https://raw.githubusercontent.com/GDS-ODSSS/unhcr-dataviz-platform/master/data/geospatial/world_polygons_simplified.json";
  const polylinesURL = "https://raw.githubusercontent.com/GDS-ODSSS/unhcr-dataviz-platform/master/data/geospatial/world_lines_simplified.json";

  let dropdown_data = [];
  let newData = [];

  //load data
  d3.csv(dataURL).then(function (data) {

    dropdown_data = [...d3.group(data, d => d['country_long']).keys()]
    dropdown_data.unshift('World')
    setup(data)

    //zoom function

    var zoom = d3.zoom()
      .scaleExtent([1, 15])
      .on('zoom', function (event) {
        poly.selectAll('path')
          .attr('transform', event.transform);
        line.selectAll('path')
          .attr('transform', event.transform);
        bubble.selectAll('circle')
          .attr('transform', event.transform);
        d3.select("#map svg")


      });
    map_svg.call(zoom);

    function reset() {

      map_svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
          .translate(...projection([0, 0]).map((c) => -c))

      );

    }

    function zoomTo(latitude, longitude) {

      map_svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(3)
          .translate(...projection([longitude, latitude]).map((c) => -c))

      );
    }

    function setup(data) {

      // Handler for dropdown value change
      var dropdownChange = function () {
        var newCountry = d3.select(this).property('value')
        if (newCountry != "World") {
          newData = d3.group(data, (d) => d.country_long)

          newData = newData.get(newCountry)

          update_map(newData)
          zoomTo(newData[0].latitude, newData[0].longitude)
        }
        else {
          newData = data
          update_map(newData)
          reset()
        }

      };


      // populate selectors
      d3.select('select.xvar')
        .on('change', dropdownChange)
        .selectAll('option')
        .data(dropdown_data)
        .enter()
        .append('option')
        .attr('value', d => d)
        .property("selected", function (d) { return d === "World"; })
        .text(function (d) {
          return d[0].toUpperCase() + d.slice(1, d.length); // capitalize 1st letter
        });


      const zoominBtn = d3.select('#zoomin-button')
      zoominBtn.on('click', () => {
        map_svg.transition().call(zoom.scaleBy, 1.25)
      })

      const zoomoutBtn = d3.select('#zoomout-button')
      zoomoutBtn.on('click', () => {
        map_svg.transition().call(zoom.scaleBy, 0.75)
      })
      const zoomresetBtn = d3.select('#zoomreset-button')
      zoomresetBtn.on('click', () => {
        reset()
      })

      //create a tooltip
      const tooltip = d3.select("#map")
        .append("div")
        .attr("class", "tooltip");

      //tooltip and mouse events
      const mouseover = function (d) {
        tooltip
          .style("opacity", 1)
        d3.select(this)
          .style("stroke", "#EF4A60")
          .style("opacity", 1)
      };
      const mousemove = function (event, d) {
        f = d3.format(",")
        tooltip
          .html(`
    <span style='color: #0072BC'><strong>Plant: ${d.name}</strong></span><br>
    <span style='color: #0072BC'><strong>Power Source: ${d.primary_fuel}</strong></span><br>
    <span style='color: #0072BC'><strong>Capacity(Mw): ${d3.format('.0f')(d.capacity_mw)}</strong></span><br>
`)
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px")
      };
      const mouseleave = function (d) {
        tooltip
          .style("opacity", 0)
        d3.select(this)
          .style("stroke", function (d) {
            return scaleColors(d.primary_fuel);
          })
          .style("opacity", 1);
      };

      //set bubble scale
      const valueScale = d3.extent(data, d => +d.capacity_mw)
      const size = d3.scaleLinear()
        .domain(valueScale)
        .range([1, 20]);

      const bubblesColors = d3.schemePaired //d3.schemeCategory10
      let fuelOptions = [...new Set(data.map(d => d.primary_fuel))];

      const scaleColors = d3.scaleOrdinal(bubblesColors)
        .domain(fuelOptions.values());


      var update_map = function (data) {

        //draw bubble
        bubble
          .selectAll("circle")
          .data(data)
          .join("circle")
          .attr("cx", d => projection([+d.longitude, +d.latitude])[0])
          .attr("cy", d => projection([+d.longitude, +d.latitude])[1])
          .attr("r", d => size(+d.capacity_mw))
          .on("mouseover", mouseover)
          .on("mousemove", mousemove)
          .on("mouseleave", mouseleave)
          .style("fill", function (d) {
            return scaleColors(d.primary_fuel);
          })
          .attr("stroke", function (d) {
            return scaleColors(d.primary_fuel);
          })
          .attr("stroke-width", 0.5)
          .attr("fill-opacity", 0.3);

        //Add Color Legend


        //svg.append("g")
        color_legend_svg.append("g")
          .attr("class", "legendOrdinal")
        //.attr("transform", "translate(700,150)");


        var legendOrdinal = d3.legendColor()
          .scale(scaleColors)
          .orient("vertical");

        color_legend_svg.select(".legendOrdinal")
          .call(legendOrdinal);



      }

      update_map(data)

      //Add legend
      const legendLabel = [500, 5000, 10000];
      const xCircle = 20;
      const xLabel = 55;

      svg
        .selectAll("legend")
        .data(legendLabel)
        .join("circle")
        .attr("cx", xCircle)
        .attr("cy", d => height * 0.1 - size(d))
        .attr("r", d => size(d))
        .style("fill", "none")
        .attr("stroke", "#666666")
        .attr("stroke-width", 0.75);

      svg
        .selectAll("legend")
        .data(legendLabel)
        .join("line")
        .attr('x1', xCircle)
        .attr('x2', xLabel)
        .attr('y1', d => height * 0.1 - size(d) * 2)
        .attr('y2', d => height * 0.1 - size(d) * 2)
        .attr('stroke', '#666666')
        .attr("stroke-width", 0.75);

      svg
        .selectAll("legend")
        .data(legendLabel)
        .join("text")
        .attr('x', xLabel)
        .attr('y', d => height * 0.1 - size(d) * 2)
        .text(d => d3.format(",")(d))
        .style("font-size", 6)
        .style("fill", "#666666")
        .attr('alignment-baseline', 'middle')

    }
  });


  //load and draw polygons
  d3.json(polygonsURL).then(function (topology) {
    poly
      .selectAll("path")
      .data(topojson.feature(topology, topology.objects.world_polygons_simplified).features)
      .join("path")
      //.attr("fill", "#CCCCCC")
      .attr("fill","#808080")
      .attr("d", generator);
  });

  //load and draw lines
  d3.json(polylinesURL).then(function (topology) {
    line
      .selectAll("path")
      .data(topojson.feature(topology, topology.objects.world_lines_simplified).features)
      .join("path")
      .style("fill", "none")
      .style("stroke", "white")
      .attr("stroke-width", 0.5)
      .attr("d", generator)
      .attr("class", d => d.properties.type)
  });



  //set note
  svg
    .append('text')
    .attr('class', "chart-source")
    .attr('x', width * 0.01)
    .attr('y', height * 0.15)
    .attr('text-anchor', 'start')
    .style('font-size', 14)
    .style("fill", "#666666")
    .text('Source: World Resources Institute');
  svg
    .append('text')
    .attr('class', "chart-source")
    .attr('x', width * 0.01)
    .attr('y', height * 0.20)
    .attr('text-anchor', 'start')
    .style('font-size', 14)
    .style("fill", "#666666")
    .text("The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations.");
}

f5();
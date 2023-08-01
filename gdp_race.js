function f3() {
   const top_n = 20;
   const height = 720;
   const width = 1280;

   const tickDuration = 500
   const delayDuration = 500

   const yearStart = 1970;
   const yearEnd = 2022;

   const title = `G20 Countries GDP annual Growth (${yearStart}-${yearEnd})`;
   const subTitle = "(Annual GDP)";

   const G20_Countries = ["Argentina", "Australia", "Brazil", "Canada", "China", "Germany",
      "European Union", "France", "United Kingdom", "Indonesia", "India", "Italy",
      "Japan", "Korea, Rep.", "Mexico", "Russian Federation", "Saudi Arabia", "Turkiye",
      "United States", "South Africa"
   ]

   const svg = d3.select("#container3").append("svg")
      .attr("width", width)
      .attr("height", height);

   const margin = {
      top: 80,
      right: 0,
      bottom: 5,
      left: 0
   };

   const barPadding = (height - (margin.bottom + margin.top)) / (top_n * 5);

   svg.append('text')
      .attr('class', 'title')
      .attr('y', 24)
      .html(title);

   svg.append("text")
      .attr("class", "subTitle")
      .attr("y", 55)
      .html(subTitle);

   svg.append('text')
      .attr('class', 'caption')
      .attr('x', width)
      .attr('y', height - 5)
      .style('text-anchor', 'end')
      .html('Source: World Bank Data Catalog');

   let year = yearStart;

   d3.csv("/dataset/GDP-Current.csv", d3.autoType)
      .then(function (data) {

         data = d3.filter(data, (d) => (G20_Countries.includes(d["Country Name"])))

         data.forEach(d => {
            d.colour = d3.hsl(Math.random() * 360, 0.75, 0.75);
         });

         let lastValues = {};

         function _normalizeData() {
            const values = {};

            const ret = [];
            data.forEach(d => {
               const name = d["Country Name"];
               const lbl = `${year}`;
               const txt = d[lbl];
               let val = 0;
               if (txt != '..')
                  val = parseFloat(txt);

               val = Math.round(val * 1e2) / 1e2; //round 2 digits

               let lastValue = lastValues[name];
               if (lastValue == null)
                  lastValue = 0;


               ret.push({
                  name: name,
                  colour: d.colour,
                  value: val,
                  lastValue: lastValue
               });

               //remember current value of the country
               values[name] = val;
            });

            lastValues = values;

            return ret.sort((a, b) => b.value - a.value).slice(0, top_n);
         }


         let yearSlice = _normalizeData();

         yearSlice.forEach((d, i) => d.rank = i);

         let x = d3.scaleLinear()
            .domain([d3.min(yearSlice, d => d.value), d3.max(yearSlice, d => d.value)])
            .range([margin.left, width - margin.right - 65]);


         format = function (n) {
            const formatted = d3.format('.3s')(n)
            return formatted.replace('G', 'B');
         }

         let y = d3.scaleLinear()
            .domain([top_n, 0])
            .range([height - margin.bottom, margin.top]);

         let xAxis = d3.axisTop()
            .scale(x)
            .ticks(width > 500 ? 5 : 2)
            .tickSize(-(height - margin.top - margin.bottom))
            .tickFormat(format);

         svg.append('g')
            .attr('class', 'axis xAxis')
            .attr('transform', `translate(0, ${margin.top})`)
            .call(xAxis)
            .selectAll('.tick line')
            .classed('origin', d => d == 0);

         svg.selectAll('rect.bar')
            .data(yearSlice, d => d.name)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', x(0) + 1)
            .attr('width', d => x(d.lastValue) - x(0))
            .attr('y', d => y(d.rank) + 5)
            .attr('height', y(1) - y(0) - barPadding)
            .style('fill', d => d.colour);

         svg.selectAll('text.label')
            .data(yearSlice, d => d.name)
            .enter()
            .append('text')
            .attr('class', 'label')
            .attr('x', d => x(d.lastValue) - 8)
            .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1)
            .style('text-anchor', 'end')
            .html(d => d.name);

         svg.selectAll('text.valueLabel')
            .data(yearSlice, d => d.name)
            .enter()
            .append('text')
            .attr('class', 'valueLabel')
            .attr('x', d => x(d.lastValue) + 5)
            .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1)
            .text(d => d.lastValue);

         let yearText = svg.append('text')
            .attr('class', 'yearText')
            .attr('x', width - margin.right)
            .attr('y', height - 25)
            .style('text-anchor', 'end')
            .html(~~year);

         let ticker = d3.interval(e => {

            yearSlice = _normalizeData();

            yearSlice.forEach((d, i) => d.rank = i);

            x.domain([0, d3.max(yearSlice, d => d.value)]);

            svg.select('.xAxis')
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .call(xAxis);

            const bars = svg.selectAll('.bar').data(yearSlice, d => d.name);

            bars
               .enter()
               .append('rect')
               .attr('class', d => `bar ${d.name.replace(/\s/g, '_')}`)
               .attr('x', x(0) + 1)
               .attr('width', d => x(d.value) - x(0))
               .attr('y', d => y(top_n + 1) + 5)
               .attr('height', y(1) - y(0) - barPadding)
               .style('fill', d => d.colour)
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .attr('y', d => y(d.rank) + 5);

            bars
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .attr('width', d => Math.max(0, x(d.value) - x(0)))
               .attr('y', d => y(d.rank) + 5);

            bars
               .exit()
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .attr('width', d => Math.max(0, x(d.value) - x(0)))
               .attr('y', d => y(top_n + 1) + 5)
               .remove();

            const labels = svg.selectAll('.label')
               .data(yearSlice, d => d.name);

            labels
               .enter()
               .append('text')
               .attr('class', 'label')
               .attr('x', d => x(d.value) - 8)
               .attr('y', d => y(top_n + 1) + 5 + ((y(1) - y(0)) / 2))
               .style('text-anchor', 'end')
               .html(d => d.name)
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1);


            labels
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .attr('x', d => x(d.value) - 8)
               .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1);

            labels
               .exit()
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .attr('x', d => x(d.value) - 8)
               .attr('y', d => y(top_n + 1) + 5)
               .remove();



            const valueLabels = svg.selectAll('.valueLabel').data(yearSlice, d => d.name);



            valueLabels
               .enter()
               .append('text')
               .attr('class', 'valueLabel')
               .attr('x', d => x(d.value) + 5)
               .attr('y', d => y(top_n + 1) + 5)
               .text(d => d.value)
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1);

            valueLabels
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .attr('x', d => x(d.value) + 5)
               .attr('y', d => y(d.rank) + 5 + ((y(1) - y(0)) / 2) + 1)
               .tween("text", function (d) {
                  const i = d3.interpolateNumber(d.lastValue, d.value);

                  return function (t) {
                     let v = i(t);
                     if (v < 0)
                        v = 0;
                     this.textContent = format(v);
                  };
               });


            valueLabels
               .exit()
               .transition()
               .duration(tickDuration)
               .ease(d3.easeLinear)
               .attr('x', d => x(d.value) + 5)
               .attr('y', d => y(top_n + 1) + 5)
               .remove();

            yearText.html(~~year);

            year++;
            if (year > yearEnd) ticker.stop();
         }, delayDuration);

      });
}

f3();
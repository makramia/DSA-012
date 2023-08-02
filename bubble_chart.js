function f4() {
    const config = {
        chart: {
            width: 600,
            height: 300,
        },
        margin: {
            left: 120,
            right: 50,
            top: 50,
            bottom: 100,
        },
        intervalDuration: 100,
    }

    const chartBounds = {
        width: config.chart.width + config.margin.left + config.margin.right,
        height: config.chart.height + config.margin.top + config.margin.bottom,
    }

    const root = d3
        .select('#container4')
        .append('svg')
        .attr('width', chartBounds.width)
        .attr('height', chartBounds.height)
        .attr('viewBox', `0 0 ${chartBounds.width} ${chartBounds.height}`)
        .append('g')
        .attr('transform', `translate(${config.margin.left}, ${config.margin.top})`)

    const scaleX = d3
        .scaleLog()
        .base(10)
        .domain([80, 150000])
        .range([0, config.chart.width])

    const scaleY = d3
        .scaleLinear()
        .domain([0, 100])
        .range([config.chart.height, 0])

    const area = d3
        .scaleSqrt()
        .range([25 * Math.PI, 1500 * Math.PI])
        .domain([2000, 1400000000]);

    const G20_Countries = ["Argentina", "Australia", "Brazil", "Canada", "China", "Germany",
        "European Union", "France", "United Kingdom", "Indonesia", "India", "Italy",
        "Japan", "Korea, Rep.", "Mexico", "Russian Federation", "Saudi Arabia", "Turkiye",
        "United States", "South Africa"
    ];

    const countriesColors = d3.schemeCategory10
    const scaleColors = d3.scaleOrdinal(countriesColors)
        .domain(G20_Countries.values());

    const xAxisCreator = d3
        .axisBottom(scaleX)
        .tickValues([100, 500, 5000, 50000])
        .tickFormat(d3.format('$,.0f'))

    const yAxisCreator = d3
        .axisLeft(scaleY)
        .tickFormat(v => +v)

    const xAxisGroup = root
        .append('g')
        .attr('transform', `translate(0, ${config.chart.height})`)
        .call(xAxisCreator)

    const yAxisGroup = root
        .append('g')
        .call(yAxisCreator)

    const xLabel = root
        .append('text')
        .attr('x', config.chart.width / 2)
        .attr('y', config.margin.top + config.chart.height)
        .attr('font-size', '20px')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .text('GDP Per Capita')

    const yLabel = root
        .append('text')
        .attr('x', -config.chart.height / 2)
        .attr('y', -config.margin.left / 2)
        .attr('font-size', '20px')
        .attr('font-weight', 'bold')
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Life Expectancy (Years)')

    const yearLabel = root
        .append('text')
        .attr('x', config.chart.width)
        .attr('y', config.chart.height - 15)
        .style('font-size', '48px')
        .style('font-weight', 'bold')
        .style('text-anchor', 'end')
        .style('fill', 'grey')
        .text('')

    const playBtn = d3.select('#play-button')
    const resetBtn = d3.select('#reset-button')
    //const continentSelect = d3.select('#continent-select')
    const slider = $('#date-slider')

    let time = 0
    let interval = null
    let countries = []

    d3.json("dataset/gdp_life_expect.json").then(function (rawData) {
        const data = rawData.map(dataSet => {
            return {
                ...dataSet,
                countries: dataSet.countries
                    .filter(country => country.population && country.gdp && country.life_expec)
                    .map(country => ({
                        ...country,
                        gdp: +country.gdp,
                        life_expec: +country.life_expec,
                    }))
            }
        })
        const getNext = () => data[time++ % data.length]
        const step = () => update(getNext())

        function addFillListener() {
            d3.selectAll('input[name="fill"]')
                .on("change", function () {

                    update(data[time])
                });
        }

        addFillListener();

        playBtn.on('click', () => {
            if (playBtn.text() === 'Play') {
                playBtn.text('Pause')
                interval = setInterval(step, config.intervalDuration)
            } else {
                playBtn.text('Play')
                clearInterval(interval)
            }
        })

        resetBtn.on('click', () => {
            time = 0
            playBtn.text('Play')
            clearInterval(interval)
            update(data[time])
        })


        slider.slider({
            max: data.length - 1,
            min: 0,
            step: 1,
            slide: (event, ui) => {
                time = ui.value
                update(data[time])
            }
        })

        step()

    })

    function flagFill() {
        return isChecked("#flags");
    }

    function isChecked(elementID) {
        return d3.select(elementID).property("checked");
    }

    function addFlagDefinitions(countries) {
        var defs = root.append("defs");
        defs.selectAll(".flag")
            .data(countries)
            .enter()
            .append("pattern")
            .attr("id", function (d) { return d.country_code; })
            .attr("class", "flag")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("patternContentUnits", "objectBoundingBox")
            .append("image")
            .attr("width", 1)
            .attr("height", 1)
            .attr("preserveAspectRatio", "xMidYMid slice")
            .attr("xlink:href", function (d) {
                return "flags/" + d.country_code + ".svg";
            });
    }



    function update(dataSet) {

        yearLabel.text(dataSet.year)

        const countries = dataSet.countries.filter(country => {
            return (G20_Countries.includes(country.country))
        })

        addFlagDefinitions(countries);

        //create a tooltip
        const tooltip = d3.select("#container4")
            .append("div")
            .attr("class", "tooltip");

        //tooltip and mouse events

        const mouseover = function (d) {
            tooltip
                .style("opacity", 1)
        };

        const mousemove = function (event, d) {
            f = d3.format(",")
            tooltip
                .html(`
  <strong>Country</strong> <span style='color: red'>${d.country}</span><br>
  <strong>Country Code</strong> <span style='color: red'>${d.country_code}</span><br>
  <strong>Life Expectancy</strong> <span style='color: red'>${d3.format('.2f')(d.life_expec)}</span><br>
  <strong>GDP Per Capita</strong> <span style='color: red'>${d3.format('$,.0f')(d.gdp)}</span><br>
  <strong>Population</strong> <span style='color: red'>${d3.format(',.0f')(d.population)}</span><br>
  `)
                .style("top", event.pageY - 10 + "px")
                .style("left", event.pageX + 10 + "px")
        };

        const mouseout = function (d) {
            tooltip
                .style("opacity", 0)
        };


        const circles = root.selectAll('circle').data(countries, d => d.country)
        circles
            .exit()
            .attr('r', 0)
            .attr('opacity', 0)
            .remove()

        circles
            .enter()
            .append('circle')
            .attr('cx', d => scaleX(d.gdp))
            .attr('cy', d => scaleY(d.life_expec))
            .attr('opacity', 0)
            .attr('stroke', '#333')
            .attr('stroke-width', 1)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout)
            .merge(circles)
            .transition()
            .duration(config.intervalDuration)
            .ease(d3.easeLinear)
            .attr('opacity', 1)
            .attr('cx', d => scaleX(d.gdp))
            .attr('cy', d => scaleY(d.life_expec))
            .attr('r', d => Math.sqrt(area(d.population) / Math.PI))
            .attr("fill", function (d) {
                return flagFill() ? "url(#" + d.country_code + ")" : scaleColors(d.country);
            });


        const yearsCount = slider.slider('option', 'max');
        slider.slider('value', time % yearsCount)
    }




}

f4();
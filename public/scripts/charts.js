const allCharts = {};

const getFormatter = (formatType, locale=undefined) => {
    switch(formatType) {
        case 'currency':
            return new Intl.NumberFormat(locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        case 'percentage':
            return new Intl.NumberFormat(locale, {
                style: 'percent',
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            });
        case 'date':
            return new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
            });
        case '3-digit-float':
            return new Intl.NumberFormat(locale, {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
            });
        default:
            return new Intl.NumberFormat(locale);
    }
}

const sparklinePercentageCharts = document.querySelectorAll('[data-chart-percentage-bar]');
sparklinePercentageCharts.forEach(element => {
    const rawdata = element.getAttribute('data-chart-percentage-bar');
    const options = {
        series: [{
            data: [rawdata]
        }],
        chart: {
            type: 'bar',
            width: 100,
            height: 30,
            sparkline: {
                enabled: true
            },
            animations: {
                enabled: false,
            },
        },
        colors: ['rgba(54, 162, 235, 0.7)'],
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '25%',
            },
        },
        labels: [0],
        yaxis: {
            min: 0,
            max: 100,
        },
        dataLabels: {
            enabled: false,
        },
        tooltip: {
            enabled: false,
        }
    };
    const chart = new ApexCharts(element, options);
    chart.render();
});

const sparklineLineCharts = document.querySelectorAll('[data-chart-line-single]');
sparklineLineCharts.forEach(element => {
    const rawdata = JSON.parse(element.getAttribute('data-chart-line-single'));
    if (rawdata.length === 0) {return;}
    const firstValue = rawdata[0];
    const lastValue = rawdata[rawdata.length - 1];
    const color = (firstValue.y > lastValue.y) ? 'rgba(0,128,0,0.5)' : 'rgba(255,0,0,0.5)';
    const options = {
        series: [{
            data: rawdata.reverse(),
        }],
        chart: {
            type: 'line',
            width: 120,
            height: 30,
            sparkline: {
                enabled: true,
            },
            animations: {
                enabled: false,
            },
        },
        colors: [color],
        stroke: {
            width: 2,
        },
        tooltip: {
            enabled: false,
        }
    };
    const chart = new ApexCharts(element, options);
    chart.render();
});

function changeButton(buttonElement) {
    if (buttonElement) {
        const parentElement = buttonElement.parentElement;
        Array.from(parentElement.children).forEach(button => {
            button.classList.remove('active');
        });
        buttonElement.classList.add('active');
    }
}

function changeChartData(buttonElement, chartId, timeSpan) {
    changeButton(buttonElement);
    const element = document.getElementById(chartId);
    const data = JSON.parse(element.getAttribute('data-' + timeSpan));
    const change = (data[0].y - data[data.length-1].y) / (data[data.length-1].y);
    const changeFormatted = getFormatter('percentage').format(change);
    const color = (change > 0) ? 'green' : 'red';
    var chart = allCharts[chartId];
    chart.updateSeries([{ data }]);
    chart.updateOptions({ title: { text: changeFormatted, style: { color } }});
}

const lineCharts = document.querySelectorAll('[data-chart-line]');
lineCharts.forEach(element => {
    const currencyFormatter = getFormatter('currency');
    const dateFormatter = getFormatter('date');
    const options = {
        noData: {
            text: 'Loading...'
        },
        series: [],
        title: {
            align: 'center',
            offsetY: 40,
            style: {
                fontSize: '1em',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
            }
        },
        chart: {
            type: 'line',
            id: element.id,
            height: 500,
            toolbar: {
                show: false
            },
            zoom: {
                autoScaleYaxis: true
            },
            animations: {
                enabled: false,
            },
        },
        colors: ['rgba(54, 162, 235, 0.7)'],
        dataLabels: {
            enabled: false,
        },
        stroke: {
            width: 2,
            curve: 'smooth',
        },
        markers: {
            size: 0,
        },
        xaxis: {
            type: 'datetime',
            show: false,
            labels: {
                show: false,
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false,
            },
            crosshairs: {
                show: false,
            },
            tooltip: {
                enabled: false,
            },
        },
        yaxis: {
            show: false,
            showAlways: false,
        },
        grid: {
            show: false,
        },
        tooltip: {
            custom: function({series, seriesIndex, dataPointIndex, w}) {
                const y = currencyFormatter.format(w.globals.series[seriesIndex][dataPointIndex]);
                const x = dateFormatter.format(w.globals.seriesX[seriesIndex][dataPointIndex]);
                return '<div class="chart-tooltip"><span>' + x + ': ' + y + '</span></div>'
            },            
        },
    };
    const chart = new ApexCharts(element, options);
    chart.render();

    // save the chart
    allCharts[element.id] = chart;

    // set chart data to 1M
    changeChartData(null, element.id, 'M1');
});

// get indices of reverse sort, based on https://stackoverflow.com/questions/46622486/what-is-the-javascript-equivalent-of-numpy-argsort
const reverseSortKeysAndValues = (keys, values) => {
    const argrsort = a => a.map(d).sort((a, b) => b[0] - a[0]).map(u); d = (v, i) => [v, i]; u = i => i[1];
    const rsindices = argrsort(values);
    const skeys = rsindices.map(i => keys[i]);
    const svalues = rsindices.map(i => values[i]);
    return [skeys, svalues];
};

const doughnutCharts = document.querySelectorAll('[data-chart-doughnut]');
doughnutCharts.forEach(element => {
    const [title, value] = JSON.parse(element.getAttribute('data-chart-doughnut'));
    const valueType = element.getAttribute('data-chart-doughnut-type');
    const valueFormatted = getFormatter(valueType).format(value)
    const data = JSON.parse(element.getAttribute('data-data'));
    const labels = JSON.parse(element.getAttribute('data-labels'));
    const dataType = element.getAttribute('data-data-type');
    const dataFormatter = getFormatter(dataType);
    const [sortedLabels, sortedData] = reverseSortKeysAndValues(labels, data);
    const options = {
        series: sortedData,
        labels: sortedLabels,
        chart: {
            type: 'donut',
            width: 220,
            height: 220,
            animations: {
                enabled: false,
            },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '90%',
                    labels: {
                        show: true,
                        value: {
                            fontSize: '0.9em',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 700,
                            color: 'black',
                            offsetY: 0,
                        },
                        total: {
                            show: true,
                            showAlways: true,
                            label: title,
                            fontSize: '0.9em',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 700,
                            color: 'black',
                            formatter: function (w) {
                                return valueFormatted;
                            }
                        }
                    }
                }
            }
        },
        responsive: [
            {
                breakpoint: 1023,
                options: {
                    chart: {
                        width: 185,
                        height: 185,
                    },
                    plotOptions: {
                        pie: {
                            donut: {
                                labels: {
                                    value: {
                                        fontSize: '0.8em',
                                    },
                                    total: {
                                        fontSize: '0.8em',
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ],
        colors: ['rgba(54, 162, 235, 0.5)'],
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        tooltip: {
            custom: function({series, seriesIndex, dataPointIndex, w}) {
                return '<div class="chart-tooltip"><span>' + w.config.labels[seriesIndex] + ': ' + dataFormatter.format(series[seriesIndex]) + '</span></div>'
            },            
        },
    };
    const chart = new ApexCharts(element, options);
    chart.render();

    // save the chart
    allCharts[element.id] = chart;
});

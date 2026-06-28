$.chart = {
    BAR_CHART: undefined,
    PIE_CHART: undefined,
    drawBarChart: function (index, data, color, cb) {
        let innerData = [],
            option;

        for (let i = 0; i < data.length; i++){
            innerData.push(data[i] / 1000);
        }
        if ($.chart.BAR_CHART === undefined){
            var app = {};
            var chartDom = document.getElementById('chart-bar');
            var myChart = echarts.init(chartDom);
            app.config = {
                rotate: 90,
                align: 'left',
                verticalAlign: 'middle',
                position: 'insideBottom',
                distance: 10,
                onChange: function () {
                    var labelOption = {
                        normal: {
                            rotate: app.config.rotate,
                            align: app.config.align,
                            verticalAlign: app.config.verticalAlign,
                            position: app.config.position,
                            distance: app.config.distance
                        }
                    };
                    myChart.setOption({
                        series: [{
                            label: labelOption
                        }]
                    });
                }
            };
            myChart.getZr().on("mouseup", function () {
                let tooltipHTML = $(".bar-tooltip").eq(0).html().split("<br>￥");
                return (cb !== undefined && tooltipHTML.length === 2) ? cb(tooltipHTML[0], tooltipHTML[1]) : null;
            });
            $.chart.BAR_CHART = myChart;
        }

        option = {
          color: [color],
          tooltip: {
            className: "bar-tooltip",
            trigger: 'axis',
            axisPointer: {
              type: 'line'
            },
            formatter: function (params) {
              return params[0].data[0] + "<br>￥" + params[0].data[1].toFixed(2);
            }
          },
          dataset: {
              source: [
                  index,
                  innerData,
              ]
          },
            title: {
                show: false,
            },
          legend: {
              show: false,
              height: 0,
          },
          xAxis: {
            type: "category",
            axisTick: {
              show: false
            }
          },
          yAxis: {
            splitNumber: 5,
            axisLabel: {
              align: "right",
              margin: 2,
              formatter: function (value, index) {
                return value < 1000 ? value : (value / 1000).toFixed(0)  + "k";
              }
            },
          },
          series: [{
            type: "bar",
            seriesLayoutBy: "row"
          }]
        }
        $.chart.BAR_CHART.setOption(option);
    },
    drawRound: function (data, cb) {
        data = data || [
            {value: 1048, name: '搜索引擎'},
            {value: 735, name: '直接访问'},
            {value: 580, name: '邮件营销'},
            {value: 484, name: '联盟广告'},
            {value: 300, name: '视频广告'}
        ];
        $("#chart-round").show();

        let option = {
            tooltip: {
                show: false,
            },
            legend: {
                top: '5%',
                left: 'center'
            },
            series: [{
                name: '百分比',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '50%'],
                left: 0,
                right: 0,
                top: "15%",
                bottom: "5%",
                avoidLabelOverlap: false,
                startAngle: 300,
                minShowLabelAngle: data.length > 7 ? 10 : 0,
                label: {
                    alignTo: 'edge',
                    formatter: '{name|{b} {c}%}\n',  // {time|￥{c}}
                    minMargin: 5,
                    edgeDistance: 10,
                    lineHeight: 16,
                    rich: {
                        name: {
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#333'
                        },
                        time: {
                            fontSize: 10,
                            color: '#999'
                        }
                    }
                },
                labelLine: {
                    length: 15,
                    length2: 0,
                    maxSurfaceAngle: 80,
                    minTurnAngle: 110,
                },
                labelLayout: function (params) {
                    var isLeft = params.labelRect.x < $.chart.PIE_CHART.getWidth() / 2;
                    var points = params.labelLinePoints;
                    // Update the end point.
                    if(points !== undefined){
                        points[2][0] = isLeft
                            ? params.labelRect.x
                            : params.labelRect.x + params.labelRect.width;
                    }
                    return {labelLinePoints: points};
                },
                data: [],
            }]
        };

        if ($.chart.PIE_CHART === undefined) {
            var chartDom = document.getElementById('chart-round');
            $.chart.PIE_CHART = echarts.init(chartDom);
        }
        $.chart.PIE_CHART.setOption(option);
        option.series[0].data = data;
        $.chart.PIE_CHART.setOption(option);
    }
}
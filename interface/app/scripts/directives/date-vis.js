'use strict';

angular.module('interfaceApp')
  .directive('dateVis', [ '$rootScope', 'configuration', 'DataService', 'D3Service', function ($rootScope, configuration, DataService, D3Service) {
    return {
      templateUrl: 'views/date-vis.html',
      restrict: 'E',
      scope: {
          'width': '@',
          'height': '@'
      },
      link: function postLink(scope, element, attrs) {

          scope.dates = [];
          scope.points = [];
          scope.ranges = [];

          scope.$watch('width', function() {
              scope.$broadcast('graph-data-loaded');
          });
          scope.$on('reset', function() {
              var dateRange = d3.selectAll('.dateRange');
              dateRange.attr('fill', function(d) { return d.color; })
                  .attr('opacity', configuration.opacity.default)
                  .attr('height', configuration.height.default) 
                  .attr('stroke', configuration.stroke.date.default);

              var circle = d3.selectAll('.datePoint');
              circle.attr('fill', function(d) { return d.color; })
                    .attr('opacity', configuration.opacity.default)
                    .attr('r', configuration.radius.date.default)
                    .attr('stroke', configuration.stroke.date.default);
          });

          scope.$on('graph-data-loaded', function() {
              // ditch any previous svg though I'm not sure why there's
              //  still one there
              d3.select('#datevis').select('svg').remove();

              if (scope.ranges.length === 0 || scope.points.length === 0 || scope.dates.length === 0) {
                  var nodes = DataService.nodes;
                  var points = [], ranges = [], dates = [];

                  // split the dataset into those nodes with both start and end
                  //  dates and those with either of start or end date
                  angular.forEach(nodes, function(v,k) {
                      if (v.df !== null && v.dt !== null) {
                          dates.push(v.df);
                          dates.push(v.dt);
                          ranges.push(v);
                      } else {
                          if (v.df !== null) {
                              dates.push(v.df);
                              points.push(v);
                          } else if (v.dt !== null) {
                              dates.push(v.dt);
                              points.push(v);
                          }
                      }
                  });
                  scope.ranges = _.sortBy(ranges, 'df').reverse();
                  points = _.sortBy(points, 'df');
                  scope.points = _.sortBy(points, 'dt').reverse();
                  scope.dates = dates;
              }

              var t1 = Date.parse(d3.min(scope.dates));
              var t2 = Date.parse(d3.max(scope.dates));

              var xScale = d3.time.scale()
                             .domain([t1, t2])
                             .range([10,scope.width - 10]);

              var xAxis = d3.svg.axis()
                            .scale(xScale)
                            .ticks(d3.time.years)
                            .ticks(6)
                            .orient("bottom");

              var svg = d3.select('#datevis')
                          .append('svg')
                          .attr('width', scope.width)
                          .attr('height', scope.height)
                          .append('g');

              var gx = svg.append('g')
                          .attr('class', 'axis')
                          .attr('transform', 'translate(0,' + (scope.height - 30) + ')')
                          .call(xAxis);

              var yScale = d3.scale.linear()
                             .domain([0, scope.ranges.length])
                             .range([10, (scope.height - 40)]);

              var dateRange = svg.selectAll('.dateRange').data(scope.ranges);
              dateRange.enter()
                  .append('rect')
                  .attr('class', 'dateRange')
                  .attr('x', function(d) {
                      var date = Date.parse(d.df);
                      return xScale(date);
                  })
                  .attr('y', function(d, i) {
                      return yScale(i);
                  })
                  .attr('width', function(d) {
                      var df = Date.parse(d.df);
                      var dt = Date.parse(d.dt);
                      return xScale(dt) - xScale(df);
                  })
                  .attr('height', configuration.height.default)
                  .attr('fill', function(d) { return d.color; })
                  .attr('id', function(d) { return D3Service.sanitize(d.id) + '_date'; })
                  .on('click', function(d) { 
                      scope.$apply(function() {
                          D3Service.highlightNodeAndLocalEnvironment(d.id); 
                      })
                  });


              yScale.domain([0, scope.points.length]);
              var circle = svg.selectAll('datePoint').data(scope.points);
              circle.enter()
                  .append('circle')
                  .attr('class', 'datePoint')
                  .attr('cx', function(d) {
                      if (d.df !== null) {
                          var date = Date.parse(d.df);
                      } else {
                          var date = Date.parse(d.dt);
                      }
                      return xScale(date);
                  })
                  .attr('cy', function(d, i) {
                      return yScale(i);
                  })
                  .attr('r', configuration.radius.date.default)
                  .attr('fill', function(d) { return d.color; })
                  .attr('id', function(d) { return D3Service.sanitize(d.id) + '_date'; })
                  .on('click', function(d) { 
                      scope.$apply(function() {
                          D3Service.highlightNodeAndLocalEnvironment(d.id); 
                      })
                  });
          });
      }
    };
  }]);

(function() {
  var svg;

  // Save off default references
  var d3 = window.d3, topojson = window.topojson;

  var defaultOptions = {
    scope: 'world',
    responsive: false,
    aspectRatio: 0.5625,
    setProjection: setProjection,
    projection: 'equirectangular',
    dataType: 'json',
    data: {},
    done: function() {},
    fills: {
      defaultFill: '#ABDDA4'
    },
    filters: {},
    geographyConfig: {
        dataUrl: null,
        hideAntarctica: true,
        hideHawaiiAndAlaska : false,
        borderWidth: 1,
        borderOpacity: 1,
        borderColor: '#FDFDFD',
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + geography.properties.name + '</strong></div>';
        },
        popupOnHover: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1
    },
    projectionConfig: {
      rotation: [97, 0]
    },
    bubblesConfig: {
        borderWidth: 2,
        borderOpacity: 1,
        borderColor: '#FFFFFF',
        popupOnHover: true,
        radius: null,
        popupTemplate: function(geography, data) {
          return '<div class="hoverinfo"><strong>' + data.name + '</strong></div>';
        },
        fillOpacity: 0.75,
        animate: true,
        highlightOnHover: true,
        highlightFillColor: '#FC8D59',
        highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
        highlightBorderWidth: 2,
        highlightBorderOpacity: 1,
        highlightFillOpacity: 0.85,
        exitDelay: 100,
        key: JSON.stringify
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600,
      popupOnHover: false,
      popupTemplate: function(geography, data) {
        // Case with latitude and longitude
        if ( ( data.origin && data.destination ) && data.origin.latitude && data.origin.longitude && data.destination.latitude && data.destination.longitude ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>Origin: ' + JSON.stringify(data.origin) + '<br>Destination: ' + JSON.stringify(data.destination) + '</div>';
        }
        // Case with only country name
        else if ( data.origin && data.destination ) {
          return '<div class="hoverinfo"><strong>Arc</strong><br>' + data.origin + ' -> ' + data.destination + '</div>';
        }
        // Missing information
        else {
          return '';
        }
      }
    }
  };

  /*
    Getter for value. If not declared on datumValue, look up the chain into optionsValue
  */
  function val( datumValue, optionsValue, context ) {
    if ( typeof context === 'undefined' ) {
      context = optionsValue;
      optionsValues = undefined;
    }
    var value = typeof datumValue !== 'undefined' ? datumValue : optionsValue;

    if (typeof value === 'undefined') {
      return  null;
    }

    if ( typeof value === 'function' ) {
      var fnContext = [context];
      if ( context.geography ) {
        fnContext = [context.geography, context.data];
      }
      return value.apply(null, fnContext);
    }
    else {
      return value;
    }
  }

  function addContainer( element, height, width ) {
    this.svg = d3.select( element ).append('svg')
      .attr('width', width || element.offsetWidth)
      .attr('data-width', width || element.offsetWidth)
      .attr('class', 'datamap')
      .attr('height', height || element.offsetHeight)
      .style('overflow', 'hidden'); // IE10+ doesn't respect height/width when map is zoomed in

    if (this.options.responsive) {
      d3.select(this.options.element).style({'position': 'relative', 'padding-bottom': (this.options.aspectRatio*100) + '%'});
      d3.select(this.options.element).select('svg').style({'position': 'absolute', 'width': '100%', 'height': '100%'});
      d3.select(this.options.element).select('svg').select('g').selectAll('path').style('vector-effect', 'non-scaling-stroke');

    }

    return this.svg;
  }

  // setProjection takes the svg element and options
  function setProjection( element, options ) {
    var width = options.width || element.offsetWidth;
    var height = options.height || element.offsetHeight;
    var projection, path;
    var svg = this.svg;

    if ( options && typeof options.scope === 'undefined') {
      options.scope = 'world';
    }

    if ( options.scope === 'usa' ) {
      projection = d3.geo.albersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
    }
    else if ( options.scope === 'world' ) {
      projection = d3.geo[options.projection]()
        .scale((width + 1) / 2 / Math.PI)
        .translate([width / 2, height / (options.projection === "mercator" ? 1.45 : 1.8)]);
    }

    if ( options.projection === 'orthographic' ) {

      svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

      svg.append("use")
          .attr("class", "stroke")
          .attr("xlink:href", "#sphere");

      svg.append("use")
          .attr("class", "fill")
          .attr("xlink:href", "#sphere");
      projection.scale(250).clipAngle(90).rotate(options.projectionConfig.rotation)
    }

    path = d3.geo.path()
      .projection( projection );

    return {path: path, projection: projection};
  }

  function addStyleBlock() {
    if ( d3.select('.datamaps-style-block').empty() ) {
      d3.select('head').append('style').attr('class', 'datamaps-style-block')
      .html('.datamap path.datamaps-graticule { fill: none; stroke: #777; stroke-width: 0.5px; stroke-opacity: .5; pointer-events: none; } .datamap .labels {pointer-events: none;} .datamap path:not(.datamaps-arc), .datamap circle, .datamap line {stroke: #FFFFFF; vector-effect: non-scaling-stroke; stroke-width: 1px;} .datamaps-legend dt, .datamaps-legend dd { float: left; margin: 0 3px 0 0;} .datamaps-legend dd {width: 20px; margin-right: 6px; border-radius: 3px;} .datamaps-legend {padding-bottom: 20px; z-index: 1001; position: absolute; left: 4px; font-size: 12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;} .datamaps-hoverover {display: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .hoverinfo {padding: 4px; border-radius: 1px; background-color: #FFF; box-shadow: 1px 1px 5px #CCC; font-size: 12px; border: 1px solid #CCC; } .hoverinfo hr {border:1px dotted #CCC; }');
    }
  }

  function drawSubunits( data ) {
    var fillData = this.options.fills,
        colorCodeData = this.options.data || {},
        geoConfig = this.options.geographyConfig;

    var subunits = this.svg.select('g.datamaps-subunits');
    if ( subunits.empty() ) {
      subunits = this.addLayer('datamaps-subunits', null, true);
    }

    var geoData = topojson.feature( data, data.objects[ this.options.scope ] ).features;
    if ( geoConfig.hideAntarctica ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "ATA";
      });
    }

    if ( geoConfig.hideHawaiiAndAlaska ) {
      geoData = geoData.filter(function(feature) {
        return feature.id !== "HI" && feature.id !== 'AK';
      });
    }

    var geo = subunits.selectAll('path.datamaps-subunit').data( geoData );

    geo.enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', function(d) {
        return 'datamaps-subunit ' + d.id;
      })
      .attr('data-info', function(d) {
        return JSON.stringify( colorCodeData[d.id]);
      })
      .style('fill', function(d) {
        // If fillKey - use that
        // Otherwise check 'fill'
        // Otherwise check 'defaultFill'
        var fillColor;

        var datum = colorCodeData[d.id];
        if ( datum && datum.fillKey ) {
          fillColor = fillData[ val(datum.fillKey, {data: colorCodeData[d.id], geography: d}) ];
        }

        if ( typeof fillColor === 'undefined' ) {
          fillColor = val(datum && datum.fillColor, fillData.defaultFill, {data: colorCodeData[d.id], geography: d});
        }

        return fillColor;
      })
      .style('stroke-width', geoConfig.borderWidth)
      .style('stroke-opacity', geoConfig.borderOpacity)
      .style('stroke', geoConfig.borderColor);
  }

  function handleGeographyConfig () {
    var hoverover;
    var svg = this.svg;
    var self = this;
    var options = this.options.geographyConfig;

    var overlayLayer = svg.select('g.datamaps-subunits');
    var hoverStrokePath = overlayLayer.append('path')
      .attr('class', 'datamaps-hover-stroke')
      .style('fill', 'none')
      .style('pointer-events', 'none');

    if ( options.highlightOnHover || options.popupOnHover ) {
      svg.selectAll('.datamaps-subunit')
        .on('mouseover', function(d) {
          var $this = d3.select(this);
          var datum = self.options.data[d.id] || {};
          if ( options.highlightOnHover ) {
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };
            $this.attr('data-previousAttributes', JSON.stringify(previousAttributes))

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum));

            hoverStrokePath
              .attr('d', self.path(d))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
          }

          if ( options.popupOnHover ) {
            self.updatePopup($this, d, options, svg);
          }
        })
        .on('mouseout', function() {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
            hoverStrokePath.attr('d', null);
          }
          $this.on('mousemove', null);
          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        });
    }

  }

  // Plugin to add a simple map legend
  function addLegend(layer, data, options) {
    data = data || {};
    if ( !this.options.fills ) {
      return;
    }

    var html = '<dl>';
    var label = '';
    if ( data.legendTitle ) {
      html = '<h2>' + data.legendTitle + '</h2>' + html;
    }
    for ( var fillKey in this.options.fills ) {

      if ( fillKey === 'defaultFill') {
        if (! data.defaultFillName ) {
          continue;
        }
        label = data.defaultFillName;
      } else {
        if (data.labels && data.labels[fillKey]) {
          label = data.labels[fillKey];
        } else {
          label= fillKey + ': ';
        }
      }
      html += '<dt>' + label + '</dt>';
      html += '<dd style="background-color:' +  this.options.fills[fillKey] + '">&nbsp;</dd>';
    }
    html += '</dl>';

    var hoverover = d3.select( this.options.element ).append('div')
      .attr('class', 'datamaps-legend')
      .html(html);
  }

    function addGraticule ( layer, options ) {
      var graticule = d3.geo.graticule();
      this.svg.insert("path", '.datamaps-subunits')
        .datum(graticule)
        .attr("class", "datamaps-graticule")
        .attr("d", this.path);
  }

  function handleArcs (layer, data, options) {
    var self = this,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - arcs must be an array";
    }

    // For some reason arc options were put in an `options` object instead of the parent arc
    // I don't like this, so to match bubbles and other plugins I'm moving it
    // This is to keep backwards compatability
    for ( var i = 0; i < data.length; i++ ) {
      data[i] = defaults(data[i], data[i].options);
      delete data[i].options;
    }

    if ( typeof options === "undefined" ) {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data( data, JSON.stringify );

    var path = d3.geo.path()
        .projection(self.projection);

    arcs
      .enter()
        .append('svg:path')
        .attr('class', 'datamaps-arc')
        .style('stroke-linecap', 'round')
        .style('stroke', function(datum) {
          return val(datum.strokeColor, options.strokeColor, datum);
        })
        .style('fill', 'none')
        .style('stroke-width', function(datum) {
            return val(datum.strokeWidth, options.strokeWidth, datum);
        })
        .attr('d', function(datum) {

            var originXY, destXY;

            if (typeof datum.origin === "string") {
              switch (datum.origin) {
                   case "CAN":
                       originXY = self.latLngToXY(56.624472, -114.665293);
                       break;
                   case "CHL":
                       originXY = self.latLngToXY(-33.448890, -70.669265);
                       break;
                   case "HRV":
                       originXY = self.latLngToXY(45.815011, 15.981919);
                       break;
                   case "IDN":
                       originXY = self.latLngToXY(-6.208763, 106.845599);
                       break;
                   case "JPN":
                       originXY = self.latLngToXY(35.689487, 139.691706);
                       break;
                   case "MYS":
                       originXY = self.latLngToXY(3.139003, 101.686855);
                       break;
                   case "NOR":
                       originXY = self.latLngToXY(59.913869, 10.752245);
                       break;
                   case "USA":
                       originXY = self.latLngToXY(41.140276, -100.760145);
                       break;
                   case "VNM":
                       originXY = self.latLngToXY(21.027764, 105.834160);
                       break;
                   default:
                       originXY = self.path.centroid(svg.select('path.' + datum.origin).data()[0]);
               }
            } else {
              originXY = self.latLngToXY(val(datum.origin.latitude, datum), val(datum.origin.longitude, datum))
            }

            if (typeof datum.destination === 'string') {
              switch (datum.destination) {
                    case "CAN":
                        destXY = self.latLngToXY(56.624472, -114.665293);
                        break;
                    case "CHL":
                        destXY = self.latLngToXY(-33.448890, -70.669265);
                        break;
                    case "HRV":
                        destXY = self.latLngToXY(45.815011, 15.981919);
                        break;
                    case "IDN":
                        destXY = self.latLngToXY(-6.208763, 106.845599);
                        break;
                    case "JPN":
                        destXY = self.latLngToXY(35.689487, 139.691706);
                        break;
                    case "MYS":
                        destXY = self.latLngToXY(3.139003, 101.686855);
                        break;
                    case "NOR":
                        destXY = self.latLngToXY(59.913869, 10.752245);
                        break;
                    case "USA":
                        destXY = self.latLngToXY(41.140276, -100.760145);
                        break;
                    case "VNM":
                        destXY = self.latLngToXY(21.027764, 105.834160);
                        break;
                    default:
                        destXY = self.path.centroid(svg.select('path.' + datum.destination).data()[0]);
              }
            } else {
              destXY = self.latLngToXY(val(datum.destination.latitude, datum), val(datum.destination.longitude, datum));
            }
            var midXY = [ (originXY[0] + destXY[0]) / 2, (originXY[1] + destXY[1]) / 2];
            if (options.greatArc) {
                  // TODO: Move this to inside `if` clause when setting attr `d`
              var greatArc = d3.geo.greatArc()
                  .source(function(d) { return [val(d.origin.longitude, d), val(d.origin.latitude, d)]; })
                  .target(function(d) { return [val(d.destination.longitude, d), val(d.destination.latitude, d)]; });

              return path(greatArc(datum))
            }
            var sharpness = val(datum.arcSharpness, options.arcSharpness, datum);
            return "M" + originXY[0] + ',' + originXY[1] + "S" + (midXY[0] + (50 * sharpness)) + "," + (midXY[1] - (75 * sharpness)) + "," + destXY[0] + "," + destXY[1];
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })
        .transition()
          .delay(100)
          .style('fill', function(datum) {
            /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
            var length = this.getTotalLength();
            this.style.transition = this.style.WebkitTransition = 'none';
            this.style.strokeDasharray = length + ' ' + length;
            this.style.strokeDashoffset = length;
            this.getBoundingClientRect();
            this.style.transition = this.style.WebkitTransition = 'stroke-dashoffset ' + val(datum.animationSpeed, options.animationSpeed, datum) + 'ms ease-out';
            this.style.strokeDashoffset = '0';
            return 'none';
          })

    arcs.exit()
      .transition()
      .style('opacity', 0)
      .remove();
  }

  function handleLabels ( layer, options ) {
    var self = this;
    options = options || {};
    var labelStartCoodinates = this.projection([-67.707617, 42.722131]);
    this.svg.selectAll(".datamaps-subunit")
      .attr("data-foo", function(d) {
        var center = self.path.centroid(d);
        if ( d.properties.iso === 'USA' ) {
            center = self.projection([-98.58333, 39.83333])
        }
        var xOffset = 7.5, yOffset = 5;

        if ( ["FL", "KY", "MI"].indexOf(d.id) > -1 ) xOffset = -2.5;
        if ( d.id === "NY" ) xOffset = -1;
        if ( d.id === "MI" ) yOffset = 18;
        if ( d.id === "LA" ) xOffset = 13;

        var x,y;

        x = center[0] - xOffset;
        y = center[1] + yOffset;

        var smallStateIndex = ["VT", "NH", "MA", "RI", "CT", "NJ", "DE", "MD", "DC"].indexOf(d.id);
        if ( smallStateIndex > -1) {
          var yStart = labelStartCoodinates[1];
          x = labelStartCoodinates[0];
          y = yStart + (smallStateIndex * (2+ (options.fontSize || 12)));
          layer.append("line")
            .attr("x1", x - 3)
            .attr("y1", y - 5)
            .attr("x2", center[0])
            .attr("y2", center[1])
            .style("stroke", options.labelColor || "#000")
            .style("stroke-width", options.lineWidth || 1)
        }

          layer.append("text")
              .attr("x", x)
              .attr("y", y)
              .style("font-size", (options.fontSize || 10) + 'px')
              .style("font-family", options.fontFamily || "Verdana")
              .style("fill", options.labelColor || "#000")
              .text(function() {
                  if (options.customLabelText && options.customLabelText[d.id]) {
                      return options.customLabelText[d.id]
                  } else {
                      return d.id
                  }
              });

        return "bar";
      });
  }


  function handleBubbles (layer, data, options ) {
    var self = this,
        fillData = this.options.fills,
        filterData = this.options.filters,
        svg = this.svg;

    if ( !data || (data && !data.slice) ) {
      throw "Datamaps Error - bubbles must be an array";
    }

    var bubbles = layer.selectAll('circle.datamaps-bubble').data( data, options.key );

    bubbles
      .enter()
        .append('svg:circle')
        .attr('class', 'datamaps-bubble')
        .attr('cx', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            if ( datum.centered === 'USA' ) {
              latLng = self.projection([-98.58333, 39.83333])
            } else {
              latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
          }
          if ( latLng ) return latLng[0];
        })
        .attr('cy', function ( datum ) {
          var latLng;
          if ( datumHasCoords(datum) ) {
            latLng = self.latLngToXY(datum.latitude, datum.longitude);
          }
          else if ( datum.centered ) {
            if ( datum.centered === 'USA' ) {
              latLng = self.projection([-98.58333, 39.83333])
            } else {
              latLng = self.path.centroid(svg.select('path.' + datum.centered).data()[0]);
            }
          }
          if ( latLng ) return latLng[1];
        })
        .attr('r', function(datum) {
          // If animation enabled start with radius 0, otherwise use full size.
          return options.animate ? 0 : val(datum.radius, options.radius, datum);
        })
        .attr('data-info', function(datum) {
          return JSON.stringify(datum);
        })
        .attr('filter', function (datum) {
          var filterKey = filterData[ val(datum.filterKey, options.filterKey, datum) ];

          if (filterKey) {
            return filterKey;
          }
        })
        .style('stroke', function ( datum ) {
          return val(datum.borderColor, options.borderColor, datum);
        })
        .style('stroke-width', function ( datum ) {
          return val(datum.borderWidth, options.borderWidth, datum);
        })
        .style('stroke-opacity', function ( datum ) {
          return val(datum.borderOpacity, options.borderOpacity, datum);
        })
        .style('fill-opacity', function ( datum ) {
          return val(datum.fillOpacity, options.fillOpacity, datum);
        })
        .style('fill', function ( datum ) {
          var fillColor = fillData[ val(datum.fillKey, options.fillKey, datum) ];
          return fillColor || fillData.defaultFill;
        })
        .on('mouseover', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Save all previous attributes for mouseout
            var previousAttributes = {
              'fill':  $this.style('fill'),
              'stroke': $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity')
            };

            $this
              .style('fill', val(datum.highlightFillColor, options.highlightFillColor, datum))
              .style('stroke', val(datum.highlightBorderColor, options.highlightBorderColor, datum))
              .style('stroke-width', val(datum.highlightBorderWidth, options.highlightBorderWidth, datum))
              .style('stroke-opacity', val(datum.highlightBorderOpacity, options.highlightBorderOpacity, datum))
              .style('fill-opacity', val(datum.highlightFillOpacity, options.highlightFillOpacity, datum))
              .attr('data-previousAttributes', JSON.stringify(previousAttributes));
          }

          if (options.popupOnHover) {
            self.updatePopup($this, datum, options, svg);
          }
        })
        .on('mouseout', function ( datum ) {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse( $this.attr('data-previousAttributes') );
            for ( var attr in previousAttributes ) {
              $this.style(attr, previousAttributes[attr]);
            }
          }

          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        })

    bubbles.transition()
      .duration(400)
      .attr('r', function ( datum ) {
        return val(datum.radius, options.radius, datum);
      })
    .transition()
      .duration(0)
      .attr('data-info', function(d) {
        return JSON.stringify(d);
      });

    bubbles.exit()
      .transition()
        .delay(options.exitDelay)
        .attr("r", 0)
        .remove();

    function datumHasCoords (datum) {
      return typeof datum !== 'undefined' && typeof datum.latitude !== 'undefined' && typeof datum.longitude !== 'undefined';
    }
  }

  function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (source) {
        for (var prop in source) {
          // Deep copy if property not set
          if (obj[prop] == null) {
            if (typeof source[prop] == 'function') {
              obj[prop] = source[prop];
            }
            else {
              obj[prop] = JSON.parse(JSON.stringify(source[prop]));
            }
          }
        }
      }
    });
    return obj;
  }
  /**************************************
             Public Functions
  ***************************************/

  function Datamap( options ) {

    if ( typeof d3 === 'undefined' || typeof topojson === 'undefined' ) {
      throw new Error('Include d3.js (v3.0.3 or greater) and topojson on this page before creating a new map');
   }
    // Set options for global use
    this.options = defaults(options, defaultOptions);
    this.options.geographyConfig = defaults(options.geographyConfig, defaultOptions.geographyConfig);
    this.options.projectionConfig = defaults(options.projectionConfig, defaultOptions.projectionConfig);
    this.options.bubblesConfig = defaults(options.bubblesConfig, defaultOptions.bubblesConfig);
    this.options.arcConfig = defaults(options.arcConfig, defaultOptions.arcConfig);

    // Add the SVG container
    if ( d3.select( this.options.element ).select('svg').length > 0 ) {
      addContainer.call(this, this.options.element, this.options.height, this.options.width );
    }

    // Add core plugins to this instance
    this.addPlugin('bubbles', handleBubbles);
    this.addPlugin('legend', addLegend);
    this.addPlugin('arc', handleArcs);
    this.addPlugin('labels', handleLabels);
    this.addPlugin('graticule', addGraticule);

    // Append style block with basic hoverover styles
    if ( ! this.options.disableDefaultStyles ) {
      addStyleBlock();
    }

    return this.draw();
  }

  // Resize map
  Datamap.prototype.resize = function () {

    var self = this;
    var options = self.options;

    if (options.responsive) {
      var newsize = options.element.clientWidth,
          oldsize = d3.select( options.element).select('svg').attr('data-width');

      d3.select(options.element).select('svg').selectAll('g').attr('transform', 'scale(' + (newsize / oldsize) + ')');
    }
  }

  // Actually draw the features(states & countries)
  Datamap.prototype.draw = function() {
    // Save off in a closure
    var self = this;
    var options = self.options;

    // Set projections and paths based on scope
    var pathAndProjection = options.setProjection.apply(this, [options.element, options] );

    this.path = pathAndProjection.path;
    this.projection = pathAndProjection.projection;

    // If custom URL for topojson data, retrieve it and render
    if ( options.geographyConfig.dataUrl ) {
      d3.json( options.geographyConfig.dataUrl, function(error, results) {
        if ( error ) throw new Error(error);
        self.customTopo = results;
        draw( results );
      });
    }
    else {
      draw( this[options.scope + 'Topo'] || options.geographyConfig.dataJson);
    }

    return this;

      function draw (data) {
        // If fetching remote data, draw the map first then call `updateChoropleth`
        if ( self.options.dataUrl ) {
          // Allow for csv or json data types
          d3[self.options.dataType](self.options.dataUrl, function(data) {
            // In the case of csv, transform data to object
            if ( self.options.dataType === 'csv' && (data && data.slice) ) {
              var tmpData = {};
              for(var i = 0; i < data.length; i++) {
                tmpData[data[i].id] = data[i];
              }
              data = tmpData;
            }
            Datamaps.prototype.updateChoropleth.call(self, data);
          });
        }
        drawSubunits.call(self, data);
        handleGeographyConfig.call(self);

        if ( self.options.geographyConfig.popupOnHover || self.options.bubblesConfig.popupOnHover) {
          hoverover = d3.select( self.options.element ).append('div')
            .attr('class', 'datamaps-hoverover')
            .style('z-index', 10001)
            .style('position', 'absolute');
        }

        // Fire off finished callback
        self.options.done(self);
      }
  };
  /**************************************
                TopoJSON
  ***************************************/
  Datamap.prototype.worldTopo = '__WORLD__';
  Datamap.prototype.abwTopo = '__ABW__';
  Datamap.prototype.afgTopo = '__AFG__';
  Datamap.prototype.agoTopo = '__AGO__';
  Datamap.prototype.aiaTopo = '__AIA__';
  Datamap.prototype.albTopo = '__ALB__';
  Datamap.prototype.aldTopo = '__ALD__';
  Datamap.prototype.andTopo = '__AND__';
  Datamap.prototype.areTopo = '__ARE__';
  Datamap.prototype.argTopo = '__ARG__';
  Datamap.prototype.armTopo = '__ARM__';
  Datamap.prototype.asmTopo = '__ASM__';
  Datamap.prototype.ataTopo = '__ATA__';
  Datamap.prototype.atcTopo = '__ATC__';
  Datamap.prototype.atfTopo = '__ATF__';
  Datamap.prototype.atgTopo = '__ATG__';
  Datamap.prototype.ausTopo = '__AUS__';
  Datamap.prototype.autTopo = '__AUT__';
  Datamap.prototype.azeTopo = '__AZE__';
  Datamap.prototype.bdiTopo = '__BDI__';
  Datamap.prototype.belTopo = '__BEL__';
  Datamap.prototype.benTopo = '__BEN__';
  Datamap.prototype.bfaTopo = '__BFA__';
  Datamap.prototype.bgdTopo = '__BGD__';
  Datamap.prototype.bgrTopo = '__BGR__';
  Datamap.prototype.bhrTopo = '__BHR__';
  Datamap.prototype.bhsTopo = '__BHS__';
  Datamap.prototype.bihTopo = '__BIH__';
  Datamap.prototype.bjnTopo = '__BJN__';
  Datamap.prototype.blmTopo = '__BLM__';
  Datamap.prototype.blrTopo = '__BLR__';
  Datamap.prototype.blzTopo = '__BLZ__';
  Datamap.prototype.bmuTopo = '__BMU__';
  Datamap.prototype.bolTopo = '__BOL__';
  Datamap.prototype.braTopo = '__BRA__';
  Datamap.prototype.brbTopo = '__BRB__';
  Datamap.prototype.brnTopo = '__BRN__';
  Datamap.prototype.btnTopo = '__BTN__';
  Datamap.prototype.norTopo = '__NOR__';
  Datamap.prototype.bwaTopo = '__BWA__';
  Datamap.prototype.cafTopo = '__CAF__';
  Datamap.prototype.canTopo = '__CAN__';
  Datamap.prototype.cheTopo = '__CHE__';
  Datamap.prototype.chlTopo = '__CHL__';
  Datamap.prototype.chnTopo = '__CHN__';
  Datamap.prototype.civTopo = '__CIV__';
  Datamap.prototype.clpTopo = '__CLP__';
  Datamap.prototype.cmrTopo = '__CMR__';
  Datamap.prototype.codTopo = '__COD__';
  Datamap.prototype.cogTopo = '__COG__';
  Datamap.prototype.cokTopo = '__COK__';
  Datamap.prototype.colTopo = '__COL__';
  Datamap.prototype.comTopo = '__COM__';
  Datamap.prototype.cpvTopo = '__CPV__';
  Datamap.prototype.criTopo = '__CRI__';
  Datamap.prototype.csiTopo = '__CSI__';
  Datamap.prototype.cubTopo = '__CUB__';
  Datamap.prototype.cuwTopo = '__CUW__';
  Datamap.prototype.cymTopo = '__CYM__';
  Datamap.prototype.cynTopo = '__CYN__';
  Datamap.prototype.cypTopo = '__CYP__';
  Datamap.prototype.czeTopo = '__CZE__';
  Datamap.prototype.deuTopo = '__DEU__';
  Datamap.prototype.djiTopo = '__DJI__';
  Datamap.prototype.dmaTopo = '__DMA__';
  Datamap.prototype.dnkTopo = '__DNK__';
  Datamap.prototype.domTopo = '__DOM__';
  Datamap.prototype.dzaTopo = '__DZA__';
  Datamap.prototype.ecuTopo = '__ECU__';
  Datamap.prototype.egyTopo = '__EGY__';
  Datamap.prototype.eriTopo = '__ERI__';
  Datamap.prototype.esbTopo = '__ESB__';
  Datamap.prototype.espTopo = '__ESP__';
  Datamap.prototype.estTopo = '__EST__';
  Datamap.prototype.ethTopo = '__ETH__';
  Datamap.prototype.finTopo = '__FIN__';
  Datamap.prototype.fjiTopo = '__FJI__';
  Datamap.prototype.flkTopo = '__FLK__';
  Datamap.prototype.fraTopo = '__FRA__';
  Datamap.prototype.froTopo = '__FRO__';
  Datamap.prototype.fsmTopo = '__FSM__';
  Datamap.prototype.gabTopo = '__GAB__';
  Datamap.prototype.psxTopo = {"type":"Topology","objects":{"psx":{"type":"GeometryCollection","geometries":[{"type":"Polygon","id":"PS.BTH","arcs":[[0,1,2,3,4,5]],"properties":{"name":"Bethlehem"}},{"type":"Polygon","id":"PS.DEB","arcs":[[6,7,8,9]],"properties":{"name":"Deir al-Balah"}},{"type":"Polygon","id":"PS.GZA","arcs":[[10,-10,11,12]],"properties":{"name":"Gaza"}},{"type":"Polygon","id":"PS.HBN","arcs":[[13,-2]],"properties":{"name":"Hebron"}},{"type":"Polygon","id":"PS.JEN","arcs":[[14,15,16,17]],"properties":{"name":"Jenin"}},{"type":"Polygon","id":"PS.JRH","arcs":[[18,19,20,21,22]],"properties":{"name":"Jericho"}},{"type":"Polygon","id":"PS.JEM","arcs":[[23,24,-6,4,-4,25,-22]],"properties":{"name":"Jerusalem"}},{"type":"Polygon","id":"PS.KYS","arcs":[[26,-8,27,28]],"properties":{"name":"Khan Younis"}},{"type":"Polygon","id":"PS.NBS","arcs":[[29,-15,30,31,32,33,-20]],"properties":{"name":"Nablus"}},{"type":"Polygon","id":"PS.NGZ","arcs":[[34,-13]],"properties":{"name":"North Gaza"}},{"type":"Polygon","id":"PS.QQA","arcs":[[35,36,-32,37]],"properties":{"name":"Qalqilya"}},{"type":"Polygon","id":"PS.RFH","arcs":[[38,-29]],"properties":{"name":"Rafah"}},{"type":"Polygon","id":"PS.RBH","arcs":[[-34,39,40,-24,-21]],"properties":{"name":"Ramallah"}},{"type":"Polygon","id":"PS.SLT","arcs":[[41,-40,-33,-37]],"properties":{"name":"Salfit"}},{"type":"Polygon","id":"PS.TBS","arcs":[[42,-16,-30,-19]],"properties":{"name":"Tubas"}},{"type":"Polygon","id":"PS.TKM","arcs":[[43,-38,-31,-18]],"properties":{"name":"Tulkarm"}}]}},"arcs":[[[7097,3906],[-90,-12],[-31,5],[-24,22],[-16,-3],[-36,-54],[-71,-43],[-14,12],[-3,-26],[-12,-7],[-13,-1],[-17,40],[-23,-3],[-49,-40],[-48,-102],[-24,-9],[-74,8],[-97,-105],[-55,-37],[-4,-40],[-120,-50],[-149,-98]],[[6127,3363],[12,-20],[-9,-30],[20,-9],[19,12],[2,24],[20,0],[4,-11],[12,26],[15,-6],[35,12],[18,-17],[16,1],[3,-13],[-12,-1],[16,-23],[53,33],[25,-1],[3,-34],[22,-18],[-3,-14],[30,2],[128,-43],[0,8],[34,7],[15,-39],[14,10],[13,-22],[31,8],[16,-21],[113,-2],[-1,-14],[27,17],[79,-10],[13,-14],[-16,-12],[24,-22],[43,-6],[-1,-31],[-65,-8],[1,-25],[-1,-1],[-25,13],[5,-6],[-29,1],[-4,20],[-8,-17],[-34,18],[-25,-17],[1,-25],[22,-29],[16,1],[9,-21],[54,-12],[-1,-12],[1,-1],[13,-36],[51,-36],[23,1],[-5,32],[57,-4],[-9,-10],[27,-12],[20,15],[21,-15],[5,35],[28,-24],[36,11],[40,-21],[20,4],[111,-85],[-1,-11],[60,-54],[92,-25],[-91,-161],[26,-37],[-2,-29],[75,-68],[1,-11],[-27,-7],[37,-59],[75,-67],[64,-12],[84,-71],[46,16],[26,-5],[182,-140],[26,-41],[18,-68],[36,-17],[-15,-31],[24,-35],[32,-12],[37,16],[108,-20],[166,-79]],[[8394,1796],[177,113],[112,92],[-7,44],[36,114],[-29,31],[12,12],[-3,89],[29,24],[-17,58],[23,33],[-6,40],[91,71],[4,16],[29,24],[9,32],[-23,60],[-45,62],[8,140],[14,16],[30,8],[-20,37],[35,43],[5,25],[22,18],[36,-3],[34,31],[-24,42],[4,44],[59,45],[-1,24],[20,38],[33,32],[-3,34],[38,49],[6,48],[-30,71],[52,117],[2,28],[63,59],[65,14],[88,91]],[[9322,3762],[-116,90],[-68,31],[-81,18],[-10,-16],[-43,-1],[-10,-18],[-39,-8],[-5,24],[-10,6],[-23,-11],[2,27],[-17,-6],[-22,19],[-39,-25],[-36,26],[-81,-14],[-46,14],[-45,-4],[-256,-85],[-57,13],[-35,30],[-60,12],[-77,-34],[-48,11],[11,-53],[-20,1],[28,-25],[-44,7],[-3,39],[-65,-55],[-114,33],[-44,-11],[-32,9],[-52,-17],[4,-29],[-26,-27],[-20,-1],[-25,21],[4,-13],[-60,-27],[-39,3],[-5,3],[-8,14],[-1,1]],[[7589,3734],[-1,0],[1,0]],[[7589,3734],[-4,5],[-7,-7],[-33,2],[-40,34],[-5,-9],[-26,2],[-2,-12],[-21,3],[2,-12],[-16,3],[-3,-18],[-10,1],[26,-9],[2,-1],[3,-3],[2,-2],[-14,5],[4,-16],[-14,13],[1,-13],[-9,11],[-7,-11],[-19,7],[3,-28],[-76,44],[1,19],[-26,22],[-14,-7],[-24,6],[-4,-22],[-17,-3],[-31,21],[-22,-3],[2,10],[-17,7],[61,17],[28,34],[-68,7],[-23,-27],[-11,6],[2,17],[-9,-16],[-34,-1],[1,18],[-20,5],[-26,40],[-3,18],[21,4],[4,11]],[[1138,1785],[-2,-2],[-5,-4],[-8,-6],[-3,-3],[-136,-148],[-107,-107],[-194,-171]],[[683,1344],[67,-44],[4,-27],[19,-22],[72,2],[58,-45],[34,46],[33,-18],[66,-84],[16,-8],[10,10],[17,-17],[65,-11]],[[1144,1126],[5,36],[41,52],[6,29],[91,79],[19,35],[48,49],[36,11],[142,107]],[[1532,1524],[0,4],[1,7],[0,4],[-3,0],[-28,9],[-3,1],[-40,10],[-1,2],[-1,5],[-2,7],[4,1],[9,1],[1,0],[2,1],[-4,10],[10,1],[6,1],[0,1],[0,1],[1,1],[-1,0],[0,1],[-2,8],[-9,-1],[-1,1],[0,1],[-1,0],[-4,-1],[-11,26],[0,2],[1,3],[1,1],[1,2],[-49,71],[16,12],[8,-3],[1,3],[-2,1],[-2,1],[-1,1],[-2,2],[-1,0],[2,2],[2,0],[1,1],[1,1],[3,1],[1,1],[1,1],[1,0],[0,1],[1,0],[1,1],[8,8],[-12,10],[-11,5],[-1,0],[-71,16],[-3,3],[-1,0],[-1,1],[-1,1],[-8,8],[-4,27],[-1,1],[0,1],[0,1],[-1,0],[0,1],[-1,1],[-1,1],[-1,1],[-1,0],[0,1],[-1,0],[-1,0],[0,1],[-1,0],[-1,0],[-1,0],[0,1],[-1,0],[-1,0],[-2,0],[-1,0],[-3,0],[-2,-2],[-2,-1],[-4,-2],[-2,1],[-1,0],[0,1],[-1,0],[-19,2],[-20,-1],[-1,0],[-1,0],[-1,0],[-2,0],[-5,0],[-13,0],[-1,0],[-1,0],[-1,0],[-1,0],[-41,-18],[-34,-7],[-17,-8],[-1,0],[-7,0]],[[1734,2429],[-143,-162],[-18,-13],[-20,3],[8,-13],[-48,-66],[-375,-393]],[[1532,1524],[44,42],[38,58],[67,28],[200,201],[35,14],[37,49],[207,157],[63,15]],[[2223,2088],[-32,26],[-15,8],[-9,4],[-1,1],[-1,1],[-3,1],[-1,1],[-1,0],[3,2],[-1,1],[-1,0],[-2,1],[-1,1],[-1,1],[-2,1],[-4,4],[-14,10],[-15,10],[-2,2],[-2,1],[-2,2],[-9,7],[-7,6],[-1,0],[-1,-3],[-2,-2],[-3,-4],[-2,-3],[-1,-2],[-9,-10],[-7,-10],[-1,0],[0,-1],[-5,5],[-6,5],[-8,7],[-9,9],[-8,8],[-6,6],[-7,6],[0,1],[-1,0],[0,1],[-1,0],[0,1],[-1,0],[-1,1],[-1,1],[-1,0],[-7,4],[-6,4],[-10,11],[-1,0],[-9,-5],[-8,-5],[-6,-3],[-2,-1],[-7,8],[-11,-3],[-12,-6],[-3,-2],[-2,0],[-9,18],[0,1],[6,8],[1,0],[-28,16],[-3,-2],[0,-1],[-1,0],[-1,-1],[-1,0],[-2,2],[-1,1],[-4,4],[-4,3],[-1,-1],[-1,0],[-5,4],[-2,2],[-1,0],[-1,1],[-1,0],[-1,1],[-4,3],[-4,3],[0,1],[-3,2],[-3,2],[-13,3],[3,1],[0,1],[1,1],[7,5],[26,10],[11,-3],[14,27],[-3,2],[-1,0],[-1,0],[-1,0],[-1,1],[-1,0],[-1,0],[-3,1],[-1,0],[-1,0],[-1,0],[-1,1],[-1,0],[0,1],[-1,0],[-1,1],[-1,1],[-1,1],[-10,8],[-1,1],[-19,14],[0,1],[-2,1],[-1,0],[0,1],[-2,1],[-6,4],[-1,1],[-3,3],[-1,0],[-1,1],[0,1],[-12,9],[-1,0],[-3,3],[-1,1],[-4,3],[-2,1],[-22,20],[-52,32],[-6,3],[-4,2]],[[6127,3363],[-138,-80],[-104,-36],[-21,1],[-99,-59],[-147,-166],[-32,-59],[-174,-183],[-37,-98],[-12,-116],[-17,-30],[-13,-83],[6,-161],[-13,-36],[28,-103],[-28,-121],[-105,-212],[-60,-71],[-50,-20],[14,-24],[-35,-44],[-35,-12],[-118,-227],[-48,-130],[6,-46],[41,-69],[22,-80],[144,-110],[7,-41],[51,-39],[54,-20],[163,40],[96,7],[34,21],[19,-18],[110,24],[30,-4],[17,18],[150,29],[427,2],[59,-4],[10,-15],[287,6],[126,-12],[132,38],[42,-21],[65,13],[43,-11],[28,20],[1,32],[12,2],[12,-16],[16,21],[18,7],[22,-10],[21,22],[81,16],[29,-23],[25,11],[26,-4],[22,30],[27,-4],[106,25],[159,129],[16,-2],[9,23],[152,115],[80,40],[48,52],[460,309]],[[6884,8287],[20,5],[4,-25],[41,-17],[12,8],[15,-23],[4,17],[15,4],[23,-50],[30,-8],[45,-34],[33,0],[69,42],[17,19],[66,-11],[14,9],[10,-24],[30,11],[36,-18],[21,5],[23,-34],[15,2],[9,-33],[10,18],[-5,26],[9,-1],[29,-36],[0,16],[12,-5],[23,18],[46,-17],[23,5],[33,-37],[16,12],[34,-19],[33,12],[51,-15],[25,22],[4,25],[12,-5],[35,18],[-4,22],[15,-4],[5,10],[-11,33],[74,-19],[56,-48],[50,-13],[12,-19],[86,-29]],[[8109,8102],[52,8],[-1,9],[23,9],[5,83],[34,-19],[45,63],[-17,8],[14,13],[-52,26],[-46,66],[6,9],[35,-3],[6,20],[-38,10],[15,12],[65,7],[-11,7],[-4,51],[22,5],[5,12],[-30,7],[16,63],[63,38],[88,-7],[32,20],[3,15],[-15,13],[61,3],[-16,26],[33,-6],[-9,23],[50,25],[-3,-41],[44,-39],[-28,-4],[0,-21],[35,-13],[42,32],[12,-3],[33,52],[1,57],[-15,25],[23,5],[18,-13],[17,9],[15,-5],[52,-46],[7,59],[-13,30],[78,-11],[1,-26],[69,99],[-31,72],[18,8]],[[8918,8944],[-60,41],[-9,25],[8,9],[-19,25],[10,8],[-15,2],[-25,55],[39,170],[28,18],[-94,158],[-13,53],[8,15],[-16,15],[5,19],[-24,61],[-131,28],[-39,34],[-103,53],[-162,18],[-84,-30],[-194,-40],[-161,-1],[-66,-36],[3,71],[-176,66],[-116,99],[-88,119],[-62,-33],[-10,-25],[-118,-42],[-25,-49],[-61,-65],[-47,5],[-29,-43],[-94,-74],[-26,-36],[-40,-9],[-77,-49],[-42,-1],[-8,-13],[15,-8],[-103,-72],[-92,-32],[-48,-32],[-35,21],[-73,-13],[-49,-56],[-25,-8],[-54,-47],[-20,-25],[8,-19]],[[6309,9274],[8,17],[30,-9],[27,9],[20,-19],[31,1],[7,-30],[-18,-20],[53,-9],[36,-55],[-16,-57],[-23,-26],[3,-35],[-37,9],[1,-32],[-23,-22],[-4,-25],[20,4],[9,28],[53,-20],[48,19],[127,25],[37,-10],[5,-9],[-15,-6],[20,-28],[-15,-47],[-40,-20],[-28,-34],[4,-13],[-29,-15],[35,-10],[-5,-10],[37,-39],[21,9],[100,3],[13,-27],[-79,-10],[-48,-55],[0,-1],[-34,-10],[4,-9],[-18,6],[-10,-21],[12,-2],[13,-33],[15,-4],[4,-31],[32,1],[-53,-27],[-7,-16],[-15,8],[12,-21],[-15,8],[-16,-16],[-23,1],[-5,-37],[41,-1],[-2,28],[31,-6],[5,21],[12,5],[53,-5],[7,-25],[24,-23],[68,-13],[-12,-30],[8,-5],[50,-21],[17,13],[35,-13],[-20,-4],[-25,-37],[-20,0],[1,-14],[30,-15],[8,-22],[-22,-9],[21,2],[16,-17],[-12,-24]],[[9968,7275],[-64,15],[-39,25],[-41,-13],[-35,10],[-53,-8],[-8,-15],[-33,-13],[6,-17],[-26,-14],[-2,-13],[-29,-8],[-15,-29],[-17,1],[-23,22],[-49,-28],[-92,33],[-47,45],[-27,6],[-32,-7],[-68,-70],[-28,0],[-43,-30],[-19,13]],[[9184,7180],[-27,-48],[-22,-14],[-61,3],[-52,25],[-18,30],[12,70],[-10,21],[-70,-14],[-4,-57],[31,-26],[8,-32],[-45,-24],[-2,-36],[-65,-16],[-12,-23],[-24,-15],[-7,-134],[-12,-5],[4,-34],[-13,-35],[-1,-91],[24,-30],[52,-31],[1,-22],[-65,-53],[-44,-12],[-36,19],[-6,45],[-60,-22],[-11,-42],[-70,-20],[-4,-12],[-1,-52],[37,-134],[27,-16],[29,-47],[19,-2],[64,-65],[91,-3],[27,-15],[3,-24],[44,-17],[3,-81]],[[8918,6089],[-8,-170],[16,-114],[24,-38],[-217,-29],[75,-29],[2,-87],[-22,-56],[-83,-74],[-59,18],[-33,3],[-5,-9],[38,3],[91,-64],[2,-23],[-25,-27],[25,-10],[-14,-4],[19,-18],[-17,-4],[19,-16],[-19,-25],[31,-16],[4,-19],[-52,-26],[-45,2],[36,-18],[71,-13],[-12,-24],[9,-23],[34,-30],[-1,-22],[35,-41],[-21,-6],[-14,-46],[-34,-11],[-19,-26],[-46,-9],[-14,-20],[0,-38],[43,-91],[-12,-43],[21,-15],[-9,-26],[19,-18],[-3,-77],[-26,-21],[-3,-26],[-29,-6],[-13,-14],[-75,4],[-19,11],[-19,-7],[-15,9],[-12,-8]],[[8537,4602],[-101,-149],[10,-8],[-9,-7],[19,-51],[42,4],[27,17],[106,-105],[-129,-22],[-18,-12],[18,-35],[21,5],[38,-34],[0,-15],[42,18],[15,-11],[-3,-17],[20,-12],[61,-7],[34,-29],[17,6],[24,-17],[20,3],[0,15],[18,9],[34,-9],[10,24],[63,6],[35,17],[62,-3],[39,31],[24,-7],[28,15],[57,-5],[38,-42],[46,-15],[31,-32],[19,-97],[50,-58],[51,-88]],[[9396,3885],[73,105],[17,69],[22,26],[110,-27],[43,12],[130,-32],[77,1],[24,21],[-7,17],[-29,17],[6,31],[-47,65],[-1,26],[26,64],[-40,67],[-33,30],[8,30],[-10,11],[16,17],[-20,2],[6,16],[-19,7],[25,5],[-12,37],[33,-5],[5,14],[17,1],[-9,42],[-17,11],[13,6],[-3,14],[19,21],[-19,3],[5,30],[-13,16],[24,7],[-35,18],[19,8],[-3,10],[-30,2],[11,24],[-11,1],[1,-12],[-17,8],[12,22],[-36,16],[21,7],[-13,13],[13,-2],[4,14],[17,-7],[-4,26],[13,-11],[2,23],[23,-7],[-13,21],[25,-4],[-16,9],[7,8],[-15,21],[30,16],[-43,15],[-33,-7],[0,41],[-48,23],[22,21],[-30,10],[-10,28],[24,9],[6,15],[-27,-8],[15,28],[-34,21],[-27,66],[27,64],[-5,48],[19,7],[17,-18],[5,25],[19,2],[-11,-12],[11,-8],[28,11],[-17,11],[-6,37],[47,-6],[-24,23],[9,9],[29,-13],[-12,17],[20,10],[-1,14],[-31,6],[30,26],[-30,12],[23,9],[-22,9],[17,3],[-11,13],[14,14],[-15,-4],[-20,30],[16,-10],[1,15],[20,5],[-10,3],[3,17],[-15,0],[-7,11],[5,16],[32,13],[-26,23],[18,6],[-2,13],[26,11],[0,12],[-7,15],[-20,-9],[-18,27],[-4,53],[-8,5],[-17,-16],[-21,37],[20,28],[-11,24],[39,24],[5,18],[-20,-11],[1,20],[-25,-14],[11,25],[-17,-20],[-15,26],[-5,-21],[-21,9],[-15,-6],[11,31],[-6,5],[-11,-11],[-20,17],[21,4],[-9,18],[24,-1],[-8,8],[13,20],[-16,-2],[-7,19],[-24,7],[45,20],[-1,19],[-48,-1],[1,10],[17,-2],[-1,10],[-31,-1],[15,22],[-10,12],[21,26],[-15,-2],[-16,14],[19,2],[2,25],[-16,-6],[-13,11],[27,45],[-23,34],[19,16],[-11,20],[21,-6],[6,-19],[11,23],[31,-3],[-7,62],[24,13],[-11,-4],[-9,16],[38,14],[-32,0],[-3,8],[22,4],[-22,9],[20,8],[-18,10],[-1,18],[23,-4],[7,-16],[9,4],[-1,57],[27,-13],[-14,26],[32,8],[-16,12],[3,11],[23,-18],[28,5],[-26,7],[23,17],[-22,7],[20,23],[-14,-1],[-6,16],[-40,-4],[23,16],[-12,22],[7,16],[-20,23],[-40,7],[24,14],[-23,41],[48,19],[34,-1],[8,20],[-11,13],[37,56],[-13,22],[22,-7],[13,18],[-26,14],[23,6],[4,22],[-13,-18],[-15,13],[-12,-22],[-9,3],[10,9],[-21,3],[6,31],[25,-14],[22,21],[-5,13],[-13,-13],[-26,9],[-6,29],[27,3],[-18,11],[22,6],[14,-11],[16,24],[30,-18],[-3,23],[17,-14],[12,5],[-6,24],[30,38],[-23,-2],[-28,18],[-12,-18],[-11,29],[14,5],[16,-9],[1,23],[-20,9],[-21,-8],[-15,30],[25,6],[8,-17],[33,22],[-8,21],[-26,-18],[-6,18],[18,21],[-25,18],[18,8],[20,-23],[18,0],[-7,28],[-35,9],[34,9],[16,-10],[13,25],[-16,4],[-10,40],[23,-1],[1,21],[18,16],[40,-3],[-1,13]],[[8537,4602],[-41,26],[-4,15],[-34,6],[-10,12],[-15,-5],[-11,-37],[-23,31],[-72,-21],[-12,-32],[-62,21],[-26,97],[-34,7],[-32,51],[-63,45],[-123,6],[-44,77],[-21,7],[-3,20],[1,0],[-1,18],[-85,-27],[-8,31],[-35,-5],[-15,18],[-60,11],[-29,-57],[-6,-41],[-11,-5],[-55,29],[6,22],[-19,19],[-2,30],[-16,11],[-64,-8],[-79,11],[3,-8],[-15,-4],[-18,14],[-3,-29],[-87,-11],[-19,1],[-23,32],[-30,-7],[-64,12],[-19,-55],[-37,-20],[6,-43],[30,-46],[-11,8],[-3,-19],[-23,-13],[-36,26],[-61,18],[-36,-17],[-11,-19],[-41,-7],[-9,16],[-13,-4],[6,25],[-55,17],[-9,-17],[-29,-13],[-41,12],[-19,-6],[-18,13],[-134,-2],[-36,19],[-55,-1],[-60,28],[6,10],[-36,-4],[-14,14],[0,-108],[-63,-115],[-32,8],[-12,-9],[-36,35],[-33,2],[24,-3],[21,-43]],[[6284,4672],[214,-113],[14,-11],[-21,2],[62,-39],[71,-8],[7,18],[21,3],[142,-85],[30,-5],[-2,13],[22,-21],[123,-28],[110,-4],[147,14],[93,-34],[52,-3],[47,-28],[29,-128],[-14,-55],[34,-42],[-12,-17],[-21,15],[3,-28],[19,-5],[-1,-50],[-5,-26],[-20,4],[-4,-72],[-10,-12],[8,-10],[24,1],[-33,-73],[-20,-8],[-30,14],[-22,39],[20,28],[-56,28],[-55,-13],[-34,29],[-25,-29],[-20,-3],[-27,12],[-47,-36]],[[9322,3762],[24,58],[50,65]],[[791,249],[80,77],[46,81],[175,87],[27,48],[26,82],[-62,409],[14,55],[34,7],[13,31]],[[683,1344],[-86,-64],[-168,-165],[-256,-222]],[[173,893],[15,-9],[26,-28],[36,-10],[-6,-7],[15,-20],[29,28],[42,-48],[46,-80],[7,11],[10,-5],[7,41],[25,-11],[42,-52],[20,-8],[-16,-44],[-39,-51],[43,-41],[21,-13],[2,19],[80,-45],[60,-2],[75,15],[-14,-55],[16,-10],[28,-105],[4,-9],[31,13],[39,-67],[-35,-25],[9,-26]],[[9184,7180],[48,97],[10,75],[-12,33],[-260,156],[-39,51],[-21,-4],[-24,47],[18,43],[-94,50],[-136,26],[-35,24],[-95,107],[-12,-11],[-37,-42],[-20,-2],[4,-14],[-59,-23],[-27,28],[-36,5],[-85,51],[-42,10],[9,14],[-25,19],[6,13],[-44,15],[-36,45],[2,43],[-43,-1],[-20,18],[-23,-2],[18,17],[15,-5],[5,26],[31,1],[-16,12]],[[6884,8287],[-78,-4],[4,-13],[24,-4],[14,8],[-6,5],[27,4],[-4,-41],[-43,-15],[-4,-37],[-22,-4],[-9,-28],[9,-5],[20,22],[-3,-45],[39,1],[-5,-10],[19,-13],[18,3],[15,-11],[-10,-13],[7,-12],[14,-5],[21,6],[0,11],[34,-2],[-34,-46],[36,4],[-5,-31],[20,-9],[-1,-12],[-13,5],[3,-8],[31,-17],[-25,-22],[-6,-23],[-22,4],[15,-13],[43,3],[1,-15],[-13,5],[-23,-15],[11,-10],[-31,-6],[-28,20],[-13,-4],[-3,10],[-19,-3],[-11,-15],[-15,16],[-15,-46],[12,-13],[9,14],[15,-6],[-13,-16],[4,-18],[21,-11],[-1,-28],[28,3],[-15,10],[13,12],[32,-14],[8,-33]],[[6961,7757],[28,-19],[-8,-21],[-37,-15],[6,-48],[20,-9],[22,13],[42,-7],[28,-38],[37,13],[4,-17],[-27,4],[-17,-10],[15,-6],[-4,-8],[19,-4],[15,13],[32,-15],[-9,-17],[15,-18],[5,7],[0,14],[18,6],[-2,14],[16,2],[0,-1],[1,0],[0,-10],[12,-4],[6,11],[7,-12],[-16,-54],[-22,-24],[-25,38],[17,-48],[-26,-14],[-11,4],[-18,-32],[4,-24],[34,-33],[-12,1],[-17,25],[21,-42],[-5,-8],[-15,27],[-17,-10],[11,-8],[-12,-10],[8,-22],[-14,-13],[9,-14],[-34,-55],[20,-12],[-33,-23],[2,-29],[-35,-48]],[[7019,7147],[5,-18],[32,13],[23,-13],[-2,-62],[-36,14],[-1,-27],[-35,-17],[7,-29],[-23,-3],[-9,11],[-15,-21],[-43,-2],[-34,-66],[17,4],[23,-31],[21,7],[-2,-12],[27,-14],[-5,-12],[22,3],[-4,-23],[17,-12],[55,9],[-2,-10],[59,-39],[5,-16],[90,0],[20,-25],[121,-2],[20,-35],[23,-14],[-27,-13],[32,-16],[47,50],[18,-5],[8,18],[22,9],[-4,28],[170,5],[4,-29],[41,-21],[-10,-24],[-29,-6],[-38,-27],[1,-48],[-10,-7],[-20,-2],[-15,17],[19,24],[-13,8],[-37,-37],[-23,5],[13,-28],[-13,-24],[4,-15],[-30,-12],[10,-17],[-44,-23],[-12,9],[3,-14],[-32,-8],[2,-17],[-20,1],[-49,-23],[-5,-16],[14,-9],[5,-22],[-52,2],[-43,-23],[-3,-15],[-52,-3],[32,-27],[-8,-26],[-39,-14]],[[7212,6310],[22,-5],[13,11],[3,-23],[23,-2],[-3,-22],[22,-19],[4,26],[-12,-1],[0,9],[18,9],[-3,11],[68,-7],[3,16],[24,16],[-11,-18],[10,-4],[19,31],[-11,8],[18,8],[13,-26],[51,-7],[-4,-14],[23,19],[9,-14],[-15,-15],[18,9],[9,-7],[-40,-17],[11,-8],[-3,-24],[21,5],[22,-17],[-10,14],[54,23],[-16,9],[52,-14],[3,-12],[35,3],[-12,16],[39,7],[5,10],[41,-27],[9,11],[21,-7],[3,9],[16,-1],[-27,15],[51,23],[5,-26],[24,-17],[-2,-30],[25,-7],[44,-44],[38,-2],[16,53],[19,6],[87,-24],[174,-81],[58,-1],[13,3],[-2,13],[35,8],[79,-13],[18,15],[62,0],[47,-12],[0,-31],[49,10],[117,-21],[22,13],[46,4],[55,-11],[26,-22],[28,6],[37,-17]],[[2223,2088],[40,8],[47,31],[116,44],[25,29],[32,14],[0,28],[56,60],[28,28],[8,58],[-562,402],[-179,-240],[-80,-100],[-11,-11],[-5,-6],[-3,-2],[0,-1],[-1,-1]],[[5820,7547],[-117,-105],[-17,-38],[-32,-6],[-13,-18],[-38,-10],[-19,-19],[-87,-5],[-45,-69],[17,-113],[36,-18],[-2,-33],[22,1],[25,-19],[50,-56],[-22,-51],[37,-27],[53,-2],[28,-47],[-9,-27],[-11,-3],[8,-31],[-23,-30],[-2,-34],[25,-47],[1,-33],[20,-17],[16,-41]],[[5721,6649],[43,16],[12,19],[25,7],[24,-7],[31,19],[30,-19],[55,-12],[0,18],[32,25],[19,40],[-10,10],[9,-1],[17,39],[49,-33],[85,2],[43,15],[5,18],[-27,21],[22,14],[-24,10],[23,48],[34,31],[55,-8],[-3,41],[40,17],[-3,115],[27,34],[-16,19],[28,3],[12,18],[11,-8],[31,28],[16,-9],[1,-30],[44,-5],[35,10],[3,13],[23,-13],[-13,-59],[37,-14],[-18,-16],[9,-8],[28,5],[7,-24],[23,11],[3,-9],[22,-1],[28,21],[42,6],[9,-17],[98,66],[29,3],[21,-14],[56,31],[42,-30],[41,30],[22,-11],[11,23]],[[6961,7757],[-23,-27],[-47,-9],[-46,-63],[-52,22],[-56,-12],[18,-15],[-1,-20],[-43,-2],[-16,19],[-26,-11],[-22,-29],[-38,-9],[6,-31],[-28,-7],[-7,-15],[-79,-26],[-37,20],[8,-40],[28,-8],[18,-39],[-27,-1],[-26,26],[-6,-20],[-30,5],[12,-21],[-26,-4],[-105,-85],[5,-26],[-9,-7],[-53,29],[-24,-9],[-26,28],[-65,29],[-4,26],[-43,14],[-16,-10],[-23,17],[-96,14],[-9,46],[18,-5],[10,16],[-4,10],[-13,-2],[12,39],[-98,6],[28,-11],[-2,-10],[-54,16],[-7,-21],[-17,3]],[[173,893],[-173,-145],[124,-202],[34,-8],[191,-538],[107,36],[94,92],[182,80],[59,41]],[[7212,6310],[-22,-8],[-10,-26],[13,-10],[-24,-16],[-19,7],[-8,22],[-38,-5],[-18,-14],[-19,17],[-12,38],[-35,-7],[-2,20],[-23,10],[51,19],[-14,8],[-51,-18],[-9,12],[-19,-1],[-27,-13],[3,-8],[-40,-5],[-19,-27],[-24,6],[15,10],[-22,9],[-50,-14],[-39,24],[6,12],[-102,5],[-46,-11],[-10,-20],[-28,0],[-10,-34],[-31,-18],[-76,19],[-2,-9],[-6,6],[-21,-10],[-20,10],[-40,-13],[-25,8],[10,-21],[-16,0],[-1,-16],[18,-17],[-20,-21],[-14,-5],[-9,13],[-45,-10],[-24,-24],[-30,11],[20,9],[-17,5],[-14,27],[-24,-4],[-5,-25],[-44,10],[-35,-11],[7,30],[-33,12],[-46,-25],[-56,24],[-26,-1],[-45,30],[-14,-19],[-24,-1],[-30,29],[-20,47],[-12,-11],[-36,14],[-22,-15]],[[5732,6320],[23,-55],[-21,-31],[26,6],[3,-10],[25,-85],[17,-148],[-43,-24],[0,-171],[-19,-95],[-13,-4],[11,-20],[-8,-35],[-16,-16],[-51,-13],[1,-22],[-44,2],[19,-49],[58,-89],[46,-155],[75,-57],[102,-23],[14,-19],[32,-182],[-24,-46],[24,-38],[-3,-82],[-153,6],[-20,-41],[-48,13],[-5,-24],[-22,-9],[-18,-31],[-39,5],[-27,35],[-15,-5],[-10,-25],[4,-35],[-99,61],[-30,-6],[-1,-18],[13,-22],[25,-13],[25,-49],[58,-54],[35,-10],[6,-22],[20,5],[37,-22],[1,-25],[22,-9],[11,6],[14,-23],[20,9],[15,27],[87,7],[47,-21],[48,1],[20,-16],[18,23],[-7,-22],[25,3],[-10,-17],[20,-3],[-10,-27],[9,-19],[56,38],[86,189],[110,-47]],[[5721,6649],[-27,-16],[4,-21],[-36,-14],[-3,-39],[-21,-42],[8,-7],[20,6],[66,-196]],[[9968,7275],[1,10],[24,9],[-21,20],[-4,31],[-34,-17],[-15,3],[25,47],[-20,20],[11,18],[14,-17],[24,20],[26,-4],[-18,47],[-20,-8],[-26,21],[23,16],[29,-7],[9,8],[-8,13],[-27,3],[11,68],[-18,6],[-4,-18],[-20,-3],[-15,41],[-22,8],[-8,18],[42,0],[-2,34],[33,-28],[9,9],[-18,10],[36,21],[-19,16],[-9,32],[-38,11],[17,80],[-35,19],[-16,61],[58,24],[-4,26],[14,45],[-37,76],[-56,26],[42,33],[-9,2],[7,16],[28,31],[-27,63],[-53,29],[16,30],[-3,26],[19,18],[-26,90],[42,36],[-34,47],[14,18],[-23,19],[5,30],[-11,25],[39,-10],[-3,-33],[14,-6],[31,69],[2,33],[-28,43],[16,40],[-65,34],[-91,-13],[-81,43],[-264,57],[-115,73],[-192,18],[-35,-19],[-25,3],[-7,-25],[-23,-12],[-58,16],[-44,30]],[[6309,9274],[-57,-48],[0,-48],[-37,-48],[-6,-54],[-24,-47],[4,-26],[-28,-30],[13,-30],[-9,-68],[-101,-168],[11,-22],[54,-9],[19,-71],[-7,-23],[-18,-33],[-29,-5],[-21,-26],[5,-36],[-12,-15],[-37,-19],[-51,6],[-11,-50],[-50,5],[-30,-19],[-9,-244],[-11,-20],[-4,27],[-18,-101],[20,-11],[-32,-82],[29,-13],[23,6],[30,-8],[25,-35],[18,-6],[35,-63],[-15,-38],[-17,-8],[-17,-30],[0,-49],[-35,-48],[7,-61],[-18,-6],[-26,15],[-52,-68]]],"transform":{"scale":[0.00013548670487048754,0.00013278943564355402],"translate":[34.2186651850001,31.2243847880001]}};
  Datamap.prototype.gbrTopo = '__GBR__';
  Datamap.prototype.geoTopo = '__GEO__';
  Datamap.prototype.ggyTopo = '__GGY__';
  Datamap.prototype.ghaTopo = '__GHA__';
  Datamap.prototype.gibTopo = '__GIB__';
  Datamap.prototype.ginTopo = '__GIN__';
  Datamap.prototype.gmbTopo = '__GMB__';
  Datamap.prototype.gnbTopo = '__GNB__';
  Datamap.prototype.gnqTopo = '__GNQ__';
  Datamap.prototype.grcTopo = '__GRC__';
  Datamap.prototype.grdTopo = '__GRD__';
  Datamap.prototype.grlTopo = '__GRL__';
  Datamap.prototype.gtmTopo = '__GTM__';
  Datamap.prototype.gumTopo = '__GUM__';
  Datamap.prototype.guyTopo = '__GUY__';
  Datamap.prototype.hkgTopo = '__HKG__';
  Datamap.prototype.hmdTopo = '__HMD__';
  Datamap.prototype.hndTopo = '__HND__';
  Datamap.prototype.hrvTopo = '__HRV__';
  Datamap.prototype.htiTopo = '__HTI__';
  Datamap.prototype.hunTopo = '__HUN__';
  Datamap.prototype.idnTopo = '__IDN__';
  Datamap.prototype.imnTopo = '__IMN__';
  Datamap.prototype.indTopo = '__IND__';
  Datamap.prototype.ioaTopo = '__IOA__';
  Datamap.prototype.iotTopo = '__IOT__';
  Datamap.prototype.irlTopo = '__IRL__';
  Datamap.prototype.irnTopo = '__IRN__';
  Datamap.prototype.irqTopo = '__IRQ__';
  Datamap.prototype.islTopo = '__ISL__';
  Datamap.prototype.isrTopo = '__ISR__';
  Datamap.prototype.itaTopo = '__ITA__';
  Datamap.prototype.jamTopo = '__JAM__';
  Datamap.prototype.jeyTopo = '__JEY__';
  Datamap.prototype.jorTopo = '__JOR__';
  Datamap.prototype.jpnTopo = '__JPN__';
  Datamap.prototype.kabTopo = '__KAB__';
  Datamap.prototype.kasTopo = '__KAS__';
  Datamap.prototype.kazTopo = '__KAZ__';
  Datamap.prototype.kenTopo = '__KEN__';
  Datamap.prototype.kgzTopo = '__KGZ__';
  Datamap.prototype.khmTopo = '__KHM__';
  Datamap.prototype.kirTopo = '__KIR__';
  Datamap.prototype.knaTopo = '__KNA__';
  Datamap.prototype.korTopo = '__KOR__';
  Datamap.prototype.kosTopo = '__KOS__';
  Datamap.prototype.kwtTopo = '__KWT__';
  Datamap.prototype.laoTopo = '__LAO__';
  Datamap.prototype.lbnTopo = '__LBN__';
  Datamap.prototype.lbrTopo = '__LBR__';
  Datamap.prototype.lbyTopo = '__LBY__';
  Datamap.prototype.lcaTopo = '__LCA__';
  Datamap.prototype.lieTopo = '__LIE__';
  Datamap.prototype.lkaTopo = '__LKA__';
  Datamap.prototype.lsoTopo = '__LSO__';
  Datamap.prototype.ltuTopo = '__LTU__';
  Datamap.prototype.luxTopo = '__LUX__';
  Datamap.prototype.lvaTopo = '__LVA__';
  Datamap.prototype.macTopo = '__MAC__';
  Datamap.prototype.mafTopo = '__MAF__';
  Datamap.prototype.marTopo = '__MAR__';
  Datamap.prototype.mcoTopo = '__MCO__';
  Datamap.prototype.mdaTopo = '__MDA__';
  Datamap.prototype.mdgTopo = '__MDG__';
  Datamap.prototype.mdvTopo = '__MDV__';
  Datamap.prototype.mexTopo = '__MEX__';
  Datamap.prototype.mhlTopo = '__MHL__';
  Datamap.prototype.mkdTopo = '__MKD__';
  Datamap.prototype.mliTopo = '__MLI__';
  Datamap.prototype.mltTopo = '__MLT__';
  Datamap.prototype.mmrTopo = '__MMR__';
  Datamap.prototype.mneTopo = '__MNE__';
  Datamap.prototype.mngTopo = '__MNG__';
  Datamap.prototype.mnpTopo = '__MNP__';
  Datamap.prototype.mozTopo = '__MOZ__';
  Datamap.prototype.mrtTopo = '__MRT__';
  Datamap.prototype.msrTopo = '__MSR__';
  Datamap.prototype.musTopo = '__MUS__';
  Datamap.prototype.mwiTopo = '__MWI__';
  Datamap.prototype.mysTopo = '__MYS__';
  Datamap.prototype.namTopo = '__NAM__';
  Datamap.prototype.nclTopo = '__NCL__';
  Datamap.prototype.nerTopo = '__NER__';
  Datamap.prototype.nfkTopo = '__NFK__';
  Datamap.prototype.ngaTopo = '__NGA__';
  Datamap.prototype.nicTopo = '__NIC__';
  Datamap.prototype.niuTopo = '__NIU__';
  Datamap.prototype.nldTopo = '__NLD__';
  Datamap.prototype.nplTopo = '__NPL__';
  Datamap.prototype.nruTopo = '__NRU__';
  Datamap.prototype.nulTopo = '__NUL__';
  Datamap.prototype.nzlTopo = '__NZL__';
  Datamap.prototype.omnTopo = '__OMN__';
  Datamap.prototype.pakTopo = '__PAK__';
  Datamap.prototype.panTopo = '__PAN__';
  Datamap.prototype.pcnTopo = '__PCN__';
  Datamap.prototype.perTopo = '__PER__';
  Datamap.prototype.pgaTopo = '__PGA__';
  Datamap.prototype.phlTopo = '__PHL__';
  Datamap.prototype.plwTopo = '__PLW__';
  Datamap.prototype.pngTopo = '__PNG__';
  Datamap.prototype.polTopo = '__POL__';
  Datamap.prototype.priTopo = '__PRI__';
  Datamap.prototype.prkTopo = '__PRK__';
  Datamap.prototype.prtTopo = '__PRT__';
  Datamap.prototype.pryTopo = '__PRY__';
  Datamap.prototype.pyfTopo = '__PYF__';
  Datamap.prototype.qatTopo = '__QAT__';
  Datamap.prototype.rouTopo = '__ROU__';
  Datamap.prototype.rusTopo = '__RUS__';
  Datamap.prototype.rwaTopo = '__RWA__';
  Datamap.prototype.sahTopo = '__SAH__';
  Datamap.prototype.sauTopo = '__SAU__';
  Datamap.prototype.scrTopo = '__SCR__';
  Datamap.prototype.sdnTopo = '__SDN__';
  Datamap.prototype.sdsTopo = '__SDS__';
  Datamap.prototype.senTopo = '__SEN__';
  Datamap.prototype.serTopo = '__SER__';
  Datamap.prototype.sgpTopo = '__SGP__';
  Datamap.prototype.sgsTopo = '__SGS__';
  Datamap.prototype.shnTopo = '__SHN__';
  Datamap.prototype.slbTopo = '__SLB__';
  Datamap.prototype.sleTopo = '__SLE__';
  Datamap.prototype.slvTopo = '__SLV__';
  Datamap.prototype.smrTopo = '__SMR__';
  Datamap.prototype.solTopo = '__SOL__';
  Datamap.prototype.somTopo = '__SOM__';
  Datamap.prototype.spmTopo = '__SPM__';
  Datamap.prototype.srbTopo = '__SRB__';
  Datamap.prototype.stpTopo = '__STP__';
  Datamap.prototype.surTopo = '__SUR__';
  Datamap.prototype.svkTopo = '__SVK__';
  Datamap.prototype.svnTopo = '__SVN__';
  Datamap.prototype.sweTopo = '__SWE__';
  Datamap.prototype.swzTopo = '__SWZ__';
  Datamap.prototype.sxmTopo = '__SXM__';
  Datamap.prototype.sycTopo = '__SYC__';
  Datamap.prototype.syrTopo = '__SYR__';
  Datamap.prototype.tcaTopo = '__TCA__';
  Datamap.prototype.tcdTopo = '__TCD__';
  Datamap.prototype.tgoTopo = '__TGO__';
  Datamap.prototype.thaTopo = '__THA__';
  Datamap.prototype.tjkTopo = '__TJK__';
  Datamap.prototype.tkmTopo = '__TKM__';
  Datamap.prototype.tlsTopo = '__TLS__';
  Datamap.prototype.tonTopo = '__TON__';
  Datamap.prototype.ttoTopo = '__TTO__';
  Datamap.prototype.tunTopo = '__TUN__';
  Datamap.prototype.turTopo = '__TUR__';
  Datamap.prototype.tuvTopo = '__TUV__';
  Datamap.prototype.twnTopo = '__TWN__';
  Datamap.prototype.tzaTopo = '__TZA__';
  Datamap.prototype.ugaTopo = '__UGA__';
  Datamap.prototype.ukrTopo = '__UKR__';
  Datamap.prototype.umiTopo = '__UMI__';
  Datamap.prototype.uryTopo = '__URY__';
  Datamap.prototype.usaTopo = '__USA__';
  Datamap.prototype.usgTopo = '__USG__';
  Datamap.prototype.uzbTopo = '__UZB__';
  Datamap.prototype.vatTopo = '__VAT__';
  Datamap.prototype.vctTopo = '__VCT__';
  Datamap.prototype.venTopo = '__VEN__';
  Datamap.prototype.vgbTopo = '__VGB__';
  Datamap.prototype.virTopo = '__VIR__';
  Datamap.prototype.vnmTopo = '__VNM__';
  Datamap.prototype.vutTopo = '__VUT__';
  Datamap.prototype.wlfTopo = '__WLF__';
  Datamap.prototype.wsbTopo = '__WSB__';
  Datamap.prototype.wsmTopo = '__WSM__';
  Datamap.prototype.yemTopo = '__YEM__';
  Datamap.prototype.zafTopo = '__ZAF__';
  Datamap.prototype.zmbTopo = '__ZMB__';
  Datamap.prototype.zweTopo = '__ZWE__';

  /**************************************
                Utilities
  ***************************************/

  // Convert lat/lng coords to X / Y coords
  Datamap.prototype.latLngToXY = function(lat, lng) {
     return this.projection([lng, lat]);
  };

  // Add <g> layer to root SVG
  Datamap.prototype.addLayer = function( className, id, first ) {
    var layer;
    if ( first ) {
      layer = this.svg.insert('g', ':first-child')
    }
    else {
      layer = this.svg.append('g')
    }
    return layer.attr('id', id || '')
      .attr('class', className || '');
  };

  Datamap.prototype.updateChoropleth = function(data, options) {
    var svg = this.svg;
    var that = this;

    // When options.reset = true, reset all the fill colors to the defaultFill and kill all data-info
    if ( options && options.reset === true ) {
      svg.selectAll('.datamaps-subunit')
        .attr('data-info', function() {
           return "{}"
        })
        .transition().style('fill', this.options.fills.defaultFill)
    }

    for ( var subunit in data ) {
      if ( data.hasOwnProperty(subunit) ) {
        var color;
        var subunitData = data[subunit]
        if ( ! subunit ) {
          continue;
        }
        else if ( typeof subunitData === "string" ) {
          color = subunitData;
        }
        else if ( typeof subunitData.color === "string" ) {
          color = subunitData.color;
        }
        else if ( typeof subunitData.fillColor === "string" ) {
          color = subunitData.fillColor;
        }
        else {
          color = this.options.fills[ subunitData.fillKey ];
        }
        // If it's an object, overriding the previous data
        if ( subunitData === Object(subunitData) ) {
          this.options.data[subunit] = defaults(subunitData, this.options.data[subunit] || {});
          var geo = this.svg.select('.' + subunit).attr('data-info', JSON.stringify(this.options.data[subunit]));
        }
        svg
          .selectAll('.' + subunit)
          .transition()
            .style('fill', color);
      }
    }
  };

  Datamap.prototype.updatePopup = function (element, d, options) {
    var self = this;
    element.on('mousemove', null);
    element.on('mousemove', function() {
      var position = d3.mouse(self.options.element);
      d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover')
        .style('top', ( (position[1] + 30)) + "px")
        .html(function() {
          var data = JSON.parse(element.attr('data-info'));
          try {
            return options.popupTemplate(d, data);
          } catch (e) {
            return "";
          }
        })
        .style('left', ( position[0]) + "px");
    });

    d3.select(self.svg[0][0].parentNode).select('.datamaps-hoverover').style('display', 'block');
  };

  Datamap.prototype.addPlugin = function( name, pluginFn ) {
    var self = this;
    if ( typeof Datamap.prototype[name] === "undefined" ) {
      Datamap.prototype[name] = function(data, options, callback, createNewLayer) {
        var layer;
        if ( typeof createNewLayer === "undefined" ) {
          createNewLayer = false;
        }

        if ( typeof options === 'function' ) {
          callback = options;
          options = undefined;
        }

        options = defaults(options || {}, self.options[name + 'Config']);

        // Add a single layer, reuse the old layer
        if ( !createNewLayer && this.options[name + 'Layer'] ) {
          layer = this.options[name + 'Layer'];
          options = options || this.options[name + 'Options'];
        }
        else {
          layer = this.addLayer(name);
          this.options[name + 'Layer'] = layer;
          this.options[name + 'Options'] = options;
        }
        pluginFn.apply(this, [layer, data, options]);
        if ( callback ) {
          callback(layer);
        }
      };
    }
  };

  // Expose library
  if (typeof exports === 'object') {
    d3 = require('d3');
    topojson = require('topojson');
    module.exports = Datamap;
  }
  else if ( typeof define === "function" && define.amd ) {
    define( "datamaps", ["require", "d3", "topojson"], function(require) {
      d3 = require('d3');
      topojson = require('topojson');

      return Datamap;
    });
  }
  else {
    window.Datamap = window.Datamaps = Datamap;
  }

  if ( window.jQuery ) {
    window.jQuery.fn.datamaps = function(options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if ( typeof callback === "function" ) {
        callback(datamap, options);
      }
      return this;
    };
  }
})();

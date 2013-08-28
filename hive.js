// A shape generator for Hive links, based on a source and a target.
// The source and target are defined in polar coordinates (angle and radius).
// Ratio links can also be drawn by using a startRadius and endRadius.
// This class is modeled after d3.svg.chord.
function link() {
  var source = function(d) { return d.source; },
      target = function(d) { return d.target; },
      angle = function(d) { return d.angle; },
      startRadius = function(d) { return d.radius; },
      endRadius = startRadius,
      arcOffset = -Math.PI / 2;

  function link(d, i) {
    var s = node(source, this, d, i),
        t = node(target, this, d, i),
        x;
    if (t.a < s.a) x = t, t = s, s = x;
    if (t.a - s.a > Math.PI) s.a += 2 * Math.PI;
    var a1 = s.a + (t.a - s.a) / 3,
        a2 = t.a - (t.a - s.a) / 3;
    return s.r0 - s.r1 || t.r0 - t.r1
        ? "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        + "L" + Math.cos(s.a) * s.r1 + "," + Math.sin(s.a) * s.r1
        + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
        + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
        + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1
        + "L" + Math.cos(t.a) * t.r0 + "," + Math.sin(t.a) * t.r0
        + "C" + Math.cos(a2) * t.r0 + "," + Math.sin(a2) * t.r0
        + " " + Math.cos(a1) * s.r0 + "," + Math.sin(a1) * s.r0
        + " " + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        : "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
        + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
        + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1;
  }

  function node(method, thiz, d, i) {
    var node = method.call(thiz, d, i),
        a = +(typeof angle === "function" ? angle.call(thiz, node, d, i) : angle) + arcOffset,
        r0 = +(typeof startRadius === "function" ? startRadius.call(thiz, node, i) : startRadius),
        r1 = (startRadius === endRadius ? r0 : +(typeof endRadius === "function" ? endRadius.call(thiz, node, i) : endRadius));
    return {r0: r0, r1: r1, a: a};
  }

  link.source = function(_) {
    if (!arguments.length) return source;
    source = _;
    return link;
  };

  link.target = function(_) {
    if (!arguments.length) return target;
    target = _;
    return link;
  };

  link.angle = function(_) {
    if (!arguments.length) return angle;
    angle = _;
    return link;
  };

  link.radius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = endRadius = _;
    return link;
  };

  link.startRadius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = _;
    return link;
  };

  link.endRadius = function(_) {
    if (!arguments.length) return endRadius;
    endRadius = _;
    return link;
  };

  return link;
}

function degrees(radians) {
  return radians / Math.PI * 180 - 90;
}

var width = 800,
    height = 800,
    innerRadius = 60,
    outerRadius = 350,
    majorAngle = 2 * Math.PI / 3,
    minorAngle = 1 * Math.PI / 12;

var angle = d3.scale.ordinal()
    .domain(d3.range(6))
    .range(
          [0 * majorAngle - minorAngle, 0 * majorAngle + minorAngle,
           1 * majorAngle - minorAngle, 1 * majorAngle + minorAngle,
           2 * majorAngle - minorAngle, 2 * majorAngle + minorAngle
          ])
    majAngle = d3.scale.ordinal()
    .domain(d3.range(3))
    .range( [0 * majorAngle, 1 * majorAngle, 2 * majorAngle, ])
    radius = d3.scale.linear().range([innerRadius, outerRadius]),
    color = d3.scale.category10().domain(d3.range(20));

var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

load_nodes("nodes.json", null, handler)

function handler(data) {
  nodes = data.nodes

  nodes = nodes.filter(function(d) {
    return !d.flags.client && d.flags.online
  })

  links = data.links.filter(function(d) {
    return d.type != "client"
  })

  nodes.forEach(function(d) {
    if (d.wifilinks.length == 0) {
      d.type = 0
    } else if (d.wifilinks.length < 3) {
      d.type = 2
    } else {
      d.type = 4
    }
  })

  nodesByType = d3.nest()
                  .key(function(d) { return d.type })
                  .sortKeys(d3.ascending)
                  .map(nodes)

  nodesByType[1] = nodesByType[0]
  nodesByType[3] = nodesByType[2]
  nodesByType[5] = nodesByType[4]

  for (var i in nodesByType) {
    var type = nodesByType[i]

    if (type == undefined) continue

    type.sort(function(a, b) {
        return a.clients.length - b.clients.length
      })
      .forEach(function(d, i) { d.index = i })
  }

  radius.domain(d3.extent(nodes, function(d) { return d.index }))

  svg.selectAll(".link")
     .data(links)
   .enter().append("path")
     .attr("class", "link")
     .attr("d", link()
         .angle(function(d, link) { 
           var source = link.source.type
           var target = link.target.type
           var offset = 0

           var distance = ((target - source) % 6 + 6) % 6

           if (distance == 0) {
             var source_links = link.source.vpns + link.source.wifi
             var target_links = link.target.vpns + link.target.wifi

             if (source_links >= target_links && link.source == d) offset = 1
             if (source_links < target_links && link.target == d) offset = 1
           }
           else if ((link.source == d && target % 2 == 0 && target == ((source + 2) % 6))
                 || (link.target == d && source % 2 == 0 && source == ((target + 2) % 6)))
                    offset = 1

           return angle(d.type + offset)
         })
         .radius(function(d) { return radius(d.index) })
         )
      .style("stroke", function(d) {
        if (d.type == "vpn") return "rgba(0,0,255,0.4)"
        else return "rgba(255,0,0,0.4)"
      })
      .style("fill", "none")

  var axes = []

  for (var i in nodesByType) {
    var type = nodesByType[i]
    axes.push(type==undefined?0:type.length)
  }

  svg.selectAll(".axis")
      .data(axes)
    .enter().append("line")
      .attr("class", "axis")
      .attr("transform", function(d, i) { return "rotate(" + degrees(angle(i)) + ")"; })
      .attr("x1", radius(-3))
      .attr("x2", function(d) {
        return radius(d + 2)
      })

  types = ["0", "1..3", ">3"]

  svg.selectAll(".axis-labels")
      .data(types)
    .enter().append("g")
      .attr("transform", function(d, i) {
        return "rotate(" + degrees(majAngle(i)) + ")" ; })
      .append("text")
      .attr("x", 20)
      .attr("text-anchor", "middle")
      .text(function(d) {
        return d
      })

  var nodes_enter = svg.selectAll(".node").data(nodes).enter()

  // first minor axis
  nodes_enter.append("circle")
      .attr("class", "node")
      .attr("transform", function(d) { return "rotate(" + degrees(angle(d.type)) + ")"; })
      .attr("cx", function(d) { return radius(d.index); })
      .attr("r", 3)
      .style("fill", function(d) { return color(d.type * 2); })
      .style("stroke", "none")

  // second minor axis
  nodes_enter.append("circle")
      .attr("class", "node")
      .attr("transform", function(d) { return "rotate(" + degrees(angle(d.type + 1)) + ")"; })
      .attr("cx", function(d) { return radius(d.index); })
      .attr("r", 3)
      .style("fill", function(d) { return color(d.type * 2); })
      .style("stroke", "none")

}

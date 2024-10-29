import * as d3 from "d3";

const port = 6000;
let savedNodeSize = 30;
let savedLinkDistance = 125;

window.onload = () => {
  savedNodeSize = Number(localStorage.getItem("nodeSize"));
  savedLinkDistance = Number(localStorage.getItem("linkDistance"));
  (document.getElementById("nodeSize") as HTMLInputElement).value =
    savedNodeSize.toString();
  (document.getElementById("linkDistance") as HTMLInputElement).value =
    savedLinkDistance.toString();
};

getNodeTree();

async function getNodeTree() {
  const response = await fetch(`http://localhost:${port}/track`);
  const data = await response.json();
  const { nodes, links } = data;

  const width = window.innerWidth;
  const height = window.innerHeight;

  const sizeArray = nodes.map((d) => d.size);
  const [minModuleSize, maxModuleSize] = d3.extent(sizeArray);

  const svg = d3.select("svg");

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden");

  const colorScale = d3
    .scaleLinear()
    .domain([minModuleSize, maxModuleSize])
    .range(["#fde68a", "#f59e0b"]);

  const link = svg
    .append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .style("stroke", "#d1d5db");

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", savedNodeSize)
    .attr("fill", (d) => colorScale(d.size))
    .attr("stroke-width", 1)
    .on("mouseover", function (event, d) {
      tooltip.style("visibility", "visible").text(`${d.size} bytes`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", `${event.pageY + 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
    })
    .call(
      d3
        .drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded)
    );

  svg
    .append("g")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .text((d) => d.id)
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "12px");

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(savedLinkDistance)
    )
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2));

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    svg
      .selectAll("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y);
  });

  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.2).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event, d) {
    d.fx = Math.max(20, Math.min(window.innerWidth - 100, event.x));
    d.fy = Math.max(20, Math.min(window.innerHeight - 100, event.y));
  }
  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  document.getElementById("nodeSize").addEventListener("input", (event) => {
    const newSize = +(event.target as HTMLInputElement).value;
    localStorage.setItem("nodeSize", String(newSize));
    node.attr("r", newSize);
    simulation.alpha(1).restart();
  });

  document.getElementById("linkDistance").addEventListener("input", (event) => {
    const newDistance = +(event.target as HTMLInputElement).value;
    localStorage.setItem("linkDistance", String(newDistance));
    simulation.force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(newDistance)
    );
    simulation.alpha(1).restart();
  });
}

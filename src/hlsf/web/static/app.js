const form = document.getElementById("prompt-form");
const promptInput = document.getElementById("prompt-input");
const useLlmInput = document.getElementById("use-llm");
const passesInput = document.getElementById("passes");
const statusEl = document.getElementById("status");
const answerOutput = document.getElementById("answer-output");
const statsList = document.getElementById("stats");

const graphSvg = d3.select("#graph");
const fftSvg = d3.select("#fft-chart");
const glyphContainer = document.getElementById("glyph-stream");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = promptInput.value.trim();
  if (!prompt) {
    statusEl.textContent = "Enter a prompt to generate a field.";
    return;
  }

  statusEl.textContent = "Synthesizing space field...";
  answerOutput.textContent = "";
  statsList.innerHTML = "";
  glyphContainer.innerHTML = "";
  clearSvg(graphSvg);
  clearSvg(fftSvg);

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        use_llm: useLlmInput.checked,
        passes: parseInt(passesInput.value, 10) || 1,
      }),
    });

    if (!response.ok) {
      const problem = await response.json();
      throw new Error(problem.detail || "Request failed");
    }

    const payload = await response.json();
    statusEl.textContent = "Field ready.";
    renderAnswer(payload.answer);
    renderStats(payload.package.stats);
    renderGraph(payload.package.space_field);
    renderFFT(payload.package.analytics.fft.tokens);
    renderGlyphStream(payload.package.analytics.glyph_stream);
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Error: ${err.message}`;
  }
});

function clearSvg(svg) {
  svg.selectAll("*").remove();
}

function renderAnswer(answer) {
  answerOutput.textContent = answer.trim();
}

function renderStats(stats) {
  statsList.innerHTML = "";
  Object.entries(stats || {}).forEach(([key, value]) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${value}</strong><div>${key}</div>`;
    statsList.appendChild(li);
  });
}

function renderGraph(spaceField) {
  const width = 800;
  const height = 520;
  clearSvg(graphSvg);

  const tokens = (spaceField.tokens || []).map((n) => ({
    ...n,
    kind: "token",
  }));
  const expansions = (spaceField.expansions || []).map((n) => ({
    ...n,
    kind: "expansion",
  }));
  const nodes = [...tokens, ...expansions];
  const links = (spaceField.edges || []).map((e) => ({
    source: e.a,
    target: e.b,
    weight: e.k,
  }));

  if (!nodes.length) {
    graphSvg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .text("No graph data");
    return;
  }

  const xExtent = padExtent(d3.extent(nodes, (d) => d.pos[0]));
  const yExtent = padExtent(d3.extent(nodes, (d) => d.pos[1]));
  const xScale = d3.scaleLinear().domain(xExtent).range([40, width - 40]);
  const yScale = d3.scaleLinear().domain(yExtent).range([40, height - 40]);

  nodes.forEach((node) => {
    node.x = xScale(node.pos[0]);
    node.y = yScale(node.pos[1]);
  });

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance((d) => 140 - 40 * (d.weight || 0))
        .strength(0.8)
    )
    .force("charge", d3.forceManyBody().strength((d) => (d.kind === "token" ? -200 : -80)))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .alphaDecay(0.08);

  const link = graphSvg
    .append("g")
    .attr("stroke", "rgba(148, 163, 184, 0.35)")
    .attr("stroke-width", 1.5)
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link");

  const node = graphSvg
    .append("g")
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(
      d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

  node
    .append("circle")
    .attr("r", (d) => (d.kind === "token" ? 22 : 16))
    .attr("fill", (d) => (d.kind === "token" ? "#38bdf8" : "#818cf8"))
    .attr("fill-opacity", (d) => (d.kind === "token" ? 0.35 : 0.25));

  node
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text((d) => d.glyph || d.text.slice(0, 2));

  node
    .append("title")
    .text((d) => `${d.kind.toUpperCase()} :: ${d.text}`);

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
  });
}

function renderFFT(series) {
  const width = 800;
  const height = 240;
  clearSvg(fftSvg);

  if (!series || !series.length) {
    fftSvg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#94a3b8")
      .text("No FFT data");
    return;
  }

  const margin = { top: 20, right: 20, bottom: 35, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = fftSvg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const maxFreq = d3.max(series, (d) => d.freq) || 1;
  const maxMag = d3.max(series, (d) => d.magnitude) || 1;
  const x = d3.scaleLinear().domain([0, maxFreq]).range([0, innerWidth]);
  const y = d3.scaleLinear().domain([0, maxMag]).range([innerHeight, 0]);

  const line = d3
    .line()
    .x((d) => x(d.freq))
    .y((d) => y(d.magnitude))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(series)
    .attr("fill", "none")
    .attr("stroke", "#38bdf8")
    .attr("stroke-width", 2)
    .attr("d", line);

  g.append("g").attr("transform", `translate(0, ${innerHeight})`).call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  g.append("text")
    .attr("x", innerWidth)
    .attr("y", innerHeight + 30)
    .attr("text-anchor", "end")
    .attr("fill", "#94a3b8")
    .text("Frequency");

  g.append("text")
    .attr("x", -20)
    .attr("y", -8)
    .attr("text-anchor", "start")
    .attr("fill", "#94a3b8")
    .text("Magnitude");
}

function renderGlyphStream(stream) {
  glyphContainer.innerHTML = "";
  if (!stream || !stream.length) {
    glyphContainer.textContent = "No glyphs available.";
    return;
  }

  stream.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "glyph-card";
    card.innerHTML = `
      <div class="label">${entry.kind}</div>
      <div class="glyph">${entry.glyph || "?"}</div>
      <div class="text">${entry.text}</div>
    `;
    glyphContainer.appendChild(card);
  });
}

function padExtent(extent) {
  const [min, max] = extent;
  if (min === undefined || max === undefined) {
    return [-1, 1];
  }
  if (min === max) {
    return [min - 1, max + 1];
  }
  return extent;
}

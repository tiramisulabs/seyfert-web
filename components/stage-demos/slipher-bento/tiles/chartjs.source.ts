import { SLOT } from "../source";

// The Chart.js guide's render call (content/docs/plugins/official/chartjs.mdx),
// its datasets line broken so the data sits on a short line of its own, and
// the data left open: the chartjs tile fills in each run's numbers.
export const CHART_SOURCE = `canvas.renderToBuffer({
  type: 'bar',
  data: {
    labels: ['January', 'February', 'March', 'April'],
    datasets: [{
      label: 'Messages',
      data: [${SLOT}],
    }],
  },
});`;

import { loadImage } from 'canvas';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import Chart from 'chart.js/auto/auto.js'; // Caminho correto para ESM
import annotationPlugin from 'chartjs-plugin-annotation';
import ChartjsPluginWatermark from 'chartjs-plugin-watermark';

// Configuração para resolver __dirname no ambiente ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho da imagem de marca d'água
const imagePath = path.resolve(__dirname, 'assets/supply.png');

// Registrar plugins
Chart.register(annotationPlugin, ChartjsPluginWatermark);

// Configuração do Canvas
const width = 900;
const height = 600;
const devicePixelRatio = 2;
const backgroundColour = '#FFFFFF';

// Função Lambda Handler
export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const {
      minimoHistorico,
      maximoHistorico,
      presetMin,
      presetMax,
      dataTime,
      series,
      title,
      subTitle,
      textLegend,
    } = body;

    if (
      !minimoHistorico || !maximoHistorico ||
      !presetMin || !presetMax || !dataTime.length ||
      !series.length || !title || !subTitle || !textLegend
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Dados incompletos!' }),
      };
    }

    const minValueHistory = Math.min(minimoHistorico, presetMin) * 0.8;
    const maxValueHistory = Math.max(maximoHistorico, presetMax) * 1.2;

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      devicePixelRatio,
      backgroundColour,
    });

    const config = {
      type: 'line',
      data: {
        labels: dataTime,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: series,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            tension: 0.4,
          },
        ],
      },
      options: {
        plugins: {
          annotation: {
            annotations: {
              minLine: {
                type: 'line',
                yMin: presetMin,
                yMax: presetMin,
                borderColor: 'yellow',
                borderWidth: 4,
                borderDash: [5, 5],
                label: {
                  enabled: true,
                  content: `min ${presetMin}`,
                  position: 'start',
                  backgroundColor: 'white',
                  color: 'black',
                },
              },
              maxLine: {
                type: 'line',
                yMin: presetMax,
                yMax: presetMax,
                borderColor: 'red',
                borderWidth: 4,
                borderDash: [5, 5],
                label: {
                  enabled: true,
                  content: `máx ${presetMax}`,
                  position: 'start',
                  backgroundColor: 'white',
                  color: 'black',
                },
              },
            },
          },
          title: { display: true, text: title },
          subtitle: { display: true, text: subTitle },
        },
        scales: {
          y: {
            max: Math.round(maxValueHistory),
            min: Math.round(minValueHistory),
            ticks: { stepSize: Math.round(maximoHistorico) >= 60 ? 10 : 5 },
            title: { display: true, text: textLegend },
          },
        },
      },
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(config);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/png' },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Erro ao gerar gráfico:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao gerar gráfico' }),
    };
  }
};

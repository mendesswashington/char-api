const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 8000;

app.use(express.json());

// Função para gerar o gráfico em Base64 usando Puppeteer
const generateChartBase64 = async (dataTime, series) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Conteúdo HTML do gráfico com Chart.js e a marca d'água
  const chartHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gráfico com Marca d'Água</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
        <canvas id="myChart" width="800" height="400"></canvas>
        <script>
            const watermarkPlugin = {
                id: 'watermark',
                beforeDraw: (chart) => {
                    const ctx = chart.ctx;
                    const width = chart.width;
                    const height = chart.height;
                    
                    ctx.save();
                    ctx.font = "30px Arial";
                    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText("Marca d'Água", width / 2, height / 2);
                    ctx.restore();
                }
            };

            const ctx = document.getElementById('myChart').getContext('2d');
            const data = {
                labels: ${JSON.stringify(dataTime)},
                datasets: [{
                    label: 'Vendas',
                    data: ${JSON.stringify(series)},
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true
                }]
            };

            const config = {
                type: 'line',
                data: data,
                options: {},
                plugins: [watermarkPlugin]
            };

            new Chart(ctx, config);
        </script>
    </body>
    </html>
    `;

  // Renderiza o HTML no Puppeteer
  await page.setContent(chartHTML);
  const element = await page.$('#myChart');

  // Tira uma captura de tela e converte para Base64
  const imageBuffer = await element.screenshot({ encoding: 'base64' });
  await browser.close();

  return imageBuffer;
};

// Endpoint para obter o gráfico em Base64
app.post('/grafico-base64', async (req, res) => {
  try {

    const { dataTime, series } = req.body;
    const base64Image = await generateChartBase64(dataTime, series);
    res.json({ base64: base64Image });
  } catch (error) {
    console.error('Erro ao gerar o gráfico:', error);
    res.status(500).json({ error: 'Erro ao gerar o gráfico' });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Google Apps ScriptのURL
const API_BASE_URL = "https://script.google.com/macros/s/AKfycbyf1Y746UnYOHFMXZUpm37jPHFBtJmji3S2IUONWMtkd6LX6yrOQA3251oq9jrsY1ar/exec";

const OUTPUT_DIR = "./dist";
const TEMPLATE_PATH = "./templates/template.html";

async function fetchJSON(sheetName) {
  const url = `${API_BASE_URL}?sheet=${sheetName}`;
  const response = await axios.get(url);
  return response.data;
}

function generateHTML(template, data) {
  return template.replace(/{{title}}/g, data.title)
                 .replace(/{{meta_description}}/g, data.meta_description)
                 .replace(/{{content}}/g, data.sections.map(section => `
                   <section id="${section.section_id}">
                       <h2>${section.heading}</h2>
                       <p>${section.content}</p>
                   </section>
                 `).join(""));
}

async function generateStaticSite() {
  try {
    // ページ一覧を取得
    const pages = await fetchJSON("pages");
    
    // HTMLテンプレートを読み込み
    const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");

    // 出力ディレクトリを作成
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

    // 各ページごとのHTMLを生成
    for (const page of pages) {
      const contentData = await fetchJSON(page.sheet);
      const html = generateHTML(template, {
        title: page.title,
        meta_description: page.meta_description,
        sections: contentData
      });

      const outputPath = path.join(OUTPUT_DIR, `${page.url}.html`);
      fs.writeFileSync(outputPath, html, "utf-8");
      console.log(`Generated: ${outputPath}`);
    }
  } catch (error) {
    console.error("Error generating static site:", error);
  }
}

generateStaticSite();

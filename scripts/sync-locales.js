const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const localesDir = path.join(__dirname, '../frontend/src/locales');
const baseLang = 'tr';
const targetLangs = ['ru', 'kg']; // Add more if needed

async function translateText(text, targetLang) {
  try {
    const prompt = `Translate the following UI text from Turkish to ${targetLang.toUpperCase()}.
Only respond with the translated text. Maintain placeholders if any.

Text: "${text}"`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.1 }
    });
    return (response.text || text).trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error(`Error translating to ${targetLang}:`, error.message);
    return text;
  }
}

async function syncObject(baseObj, targetObj, targetLang) {
  let changed = false;
  for (const key in baseObj) {
    if (typeof baseObj[key] === 'object') {
      targetObj[key] = targetObj[key] || {};
      const subChanged = await syncObject(baseObj[key], targetObj[key], targetLang);
      if (subChanged) changed = true;
    } else {
      if (!targetObj[key]) {
        console.log(`Translating [${targetLang}] key: ${key} -> "${baseObj[key]}"`);
        targetObj[key] = await translateText(baseObj[key], targetLang);
        changed = true;
      }
    }
  }
  return changed;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY missing in backend/.env');
    process.exit(1);
  }

  const baseFile = path.join(localesDir, `${baseLang}.json`);
  const baseData = JSON.parse(fs.readFileSync(baseFile, 'utf-8'));

  for (const lang of targetLangs) {
    const targetFile = path.join(localesDir, `${lang}.json`);
    let targetData = {};
    if (fs.existsSync(targetFile)) {
      targetData = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
    }

    console.log(`\nSyncing ${lang}.json...`);
    const changed = await syncObject(baseData, targetData, lang);

    if (changed) {
      fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2));
      console.log(`✅ Updated ${lang}.json`);
    } else {
      console.log(`✨ ${lang}.json is already up to date.`);
    }
  }
}

main();

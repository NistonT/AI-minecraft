const bot = mineflayer.createBot({
host: "localhost",
port: 61701,
username: "Robert_Polson"
});

bot.once("spawn", function () {
bot.chat("");
});

bot.on("chat", function(username, message) {
switch (message.toLowerCase()) {
case "его имя роберт полсон":
bot.chat(messageBot[random(0, 2)]);
break;

        default:
            break;
    }

});

const mineflayer = require("mineflayer");

const bot = mineflayer.createBot({
host: "localhost",
port: 61701,
username: "MELLSTROY1488"
});

bot.once("spawn", function () {
setTimeout(() => {
bot.chat("Шо ты маленький привет");
}, 5000);
setTimeout(() => {
bot.chat("шо ты плачешь");
}, 7000);
setTimeout(() => {
bot.chat("Или нет шо ты лысый");
}, 9000);
setTimeout(() => {
bot.chat("плаки плаки или нормалдаки");
}, 11000);

setInterval(() => {
bot.chat("Поехали!");
}, 50000);
});

bot.on("chat", function(username, message) {
switch (message.toLowerCase()) {
case "его имя роберт полсон":
bot.chat(messageBot[random(0, 2)]);
break;

        default:
            break;
    }

});

// const messageBot = ["Его имя Роберт Полсон", "Я не Тайлер Дерден", "Ладно, я Тайлер Дерден"];

// function random(min, max) {
// const minCeiled = Math.ceil(min);
// const maxFloored = Math.floor(max);
// return Math.floor(Math.random() \* (maxFloored - minCeiled + 1) + minCeiled);
// }

/\*
const apiUrl = process.env.API_LLAMA; // URL API Ollama
if (!apiUrl || !apiUrl.startsWith('http')) {
throw new Error('Invalid API_LLAMA URL');
}

    try {
      if (!data.days || typeof data.days !== 'number' || data.days <= 0) {
        throw new Error('Invalid or missing days parameter');
      }

      const prompt = this.formatPrompt(data);
      const response = await lastValueFrom(
        this.httpService.post(
          apiUrl,
          {
            model: 'llama3.1:8b',
            prompt: prompt,
            stream: false,
            format: 'json',
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 0,
          },
        ),
      );

      const jsonResponse = this.extractJsonFromResponse(response.data);
      const correctedSchedule = this.correctSchedule(jsonResponse, data);

      return correctedSchedule.response;

\*/

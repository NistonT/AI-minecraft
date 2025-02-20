import dotenv from "dotenv";
import { createBot } from "mineflayer";
import { host, port, username } from "./constants";
import { systemMessage } from "./system";
import { IBotConfig } from "./type";

dotenv.config();

async function Main(): Promise<void> {
	try {
		if (!host || !port || !username) {
			throw new Error("Ты не ввел хост, порт или имя");
		}

		const parsedPort = parseInt(port, 10);
		if (isNaN(parsedPort)) {
			throw new Error("Invalid PORT value. It must be a valid number.");
		}

		const config: IBotConfig = {
			host,
			port: parsedPort,
			username,
		};

		const bot = createBot(config);
		bot.once("spawn", () => {
			console.log("Бот успешно вошел в игру.");
			bot.chat("Привет мир!");

			bot.on("chat", async (username: string, message: string) => {
				if (username === bot.username) return;

				try {
					console.log(`${username} сказал: ${message}`);
					const headers = new Headers({
						Authorization: `Bearer ${process.env.API_KEY || ""}`,
						"HTTP-Referer": "http://localhost",
						"Content-Type": "application/json",
					});

					if (process.env.NAME_AI) {
						headers.append("X-Title", process.env.NAME_AI);
					}

					const response = await fetch(
						"https://openrouter.ai/api/v1/chat/completions",
						{
							method: "POST",
							headers,
							body: JSON.stringify({
								model: "qwen/qwen2.5-vl-72b-instruct:free",
								messages: [
									{ role: "system", content: systemMessage },
									{
										role: "user",
										content: `${message}. - сообщение написал ${username}`,
									},
								],
							}),
						}
					);

					if (!response.ok) {
						throw new Error(
							`Ошибка API: ${response.status} ${response.statusText}`
						);
					}

					const data = await response.json();
					const responseMessage =
						data.choices[0]?.message?.content || "Я не могу ответить.";
					bot.chat(responseMessage);
				} catch (error) {
					console.error("Ошибка при обработке сообщения:", error.message);
					bot.chat("Произошла ошибка при обработке сообщения.");
				}
			});
		});

		bot.on("error", err => {
			console.error("Ошибка бота:", err.message);
		});

		bot.on("end", () => {
			console.log("Бот отключился.");
		});
	} catch (error) {
		console.error("Ошибка инициализации:", error.message);
	}
}

Main();

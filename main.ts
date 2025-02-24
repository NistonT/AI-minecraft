import dotenv from "dotenv";
import { createBot } from "mineflayer";
import { Movements, goals, pathfinder } from "mineflayer-pathfinder";
import { Entity } from "prismarine-entity"; // Импорт типа Entity
import { host, port, username } from "./constants";
import { systemMessage } from "./system";
import { IBotConfig } from "./type";

dotenv.config();

// Переменные для хранения целей
let followTarget: Entity | null = null; // Для следования за игроком
let lookTarget: Entity | null = null; // Для смотрения на игрока
let bot: any; // Объявляем bot в глобальной области видимости

// Массив для хранения памяти сессии
let sessionMemory: Array<{ role: string; content: string }> = [
	{ role: "system", content: systemMessage },
];

// Функция для отправки сообщений с задержкой
function sendMessageWithDelay(message: string, delay: number = 2000) {
	const words = message.split(" ");
	let currentIndex = 0;

	const sendNextPart = () => {
		if (currentIndex >= words.length) return;

		// Собираем следующую часть сообщения (например, 9 слов за раз)
		const part = words.slice(currentIndex, currentIndex + 9).join(" ");
		currentIndex += 9;

		// Отправляем часть сообщения
		safeChat(part);

		// Устанавливаем задержку перед отправкой следующей части
		setTimeout(sendNextPart, delay);
	};

	// Начинаем отправку
	sendNextPart();
}

// Функция для безопасной отправки сообщений
function safeChat(message: string) {
	try {
		// Проверяем, что сообщение не пустое и не содержит недопустимых символов
		if (message && message.trim().length > 0) {
			bot.chat(message);
		} else {
			console.error("Сообщение пустое или содержит недопустимые символы.");
		}
	} catch (error) {
		console.error("Ошибка при отправке сообщения:", error.message);
	}
}

async function Main(): Promise<void> {
	try {
		if (!host || !port || !username) {
			throw new Error("Ты не ввел хост, порт или имя");
		}

		const parsedPort = parseInt(port, 10);
		if (isNaN(parsedPort)) {
			throw new Error("Неверный порт");
		}

		const config: IBotConfig = {
			host,
			port: parsedPort,
			username,
		};

		bot = createBot(config);
		bot.loadPlugin(pathfinder);

		bot.once("spawn", () => {
			console.log("Бот успешно вошел в игру.");
			safeChat("Привет мир!");

			bot.on("chat", async (username: string, message: string) => {
				if (username === bot.username) return;

				try {
					console.log(`${username} сказал: ${message}`);

					// Проверка наличия API-ключа
					if (!process.env.API_KEY) {
						throw new Error("API_KEY не установлен в .env файле.");
					}

					// Добавляем сообщение игрока в память сессии
					sessionMemory.push({
						role: "user",
						content: `${message}. - сообщение написал ${username}`,
					});

					const headers = new Headers({
						Authorization: `Bearer ${process.env.API_KEY}`,
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
								model: "qwen/qwen2.5-vl-72b-instruct:free", // Используем другую модель
								messages: sessionMemory, // Передаем всю историю сообщений
							}),
						}
					);

					// Логирование ответа от API
					console.log("Статус ответа:", response.status);
					const data = await response.json();
					console.log("Ответ от API:", JSON.stringify(data, null, 2));

					if (!response.ok) {
						if (
							data.error?.code === 429 ||
							data.error?.metadata?.raw?.includes("insufficient_quota")
						) {
							throw new Error(
								"Квота API исчерпана. Проверьте ваш тарифный план."
							);
						} else {
							throw new Error(
								`Ошибка API: ${response.status} ${response.statusText}`
							);
						}
					}

					if (!data.choices || data.choices.length === 0) {
						throw new Error("Ответ от API не содержит choices");
					}

					const responseMessage =
						data.choices[0]?.message?.content || "Я не могу ответить.";

					// Добавляем ответ бота в память сессии
					sessionMemory.push({
						role: "assistant",
						content: responseMessage,
					});

					console.log("Ответ от бота:", responseMessage);

					// Обработка команд
					if (responseMessage.includes("/")) {
						sendMessageWithDelay(
							responseMessage.slice(0, responseMessage.length / 2)
						);
					} else if (responseMessage.includes(`Идти за ${username}`)) {
						const targetPlayer = bot.players[username]?.entity;
						if (targetPlayer) {
							followTarget = targetPlayer;
							sendMessageWithDelay(`Следую за тобой, ${username}!`);
							startFollowing();
						} else {
							sendMessageWithDelay("Я не вижу тебя, где ты?");
						}
					} else if (responseMessage === "stopstop") {
						followTarget = null;
						bot.pathfinder.setGoal(null);
						sendMessageWithDelay("Останавливаюсь.");
					} else if (responseMessage === `Cмотрю на ${username}`) {
						const targetPlayer = bot.players[username]?.entity;
						if (targetPlayer) {
							lookTarget = targetPlayer;
							sendMessageWithDelay(`Смотрю на тебя, ${username}!`);
							startLooking();
						} else {
							sendMessageWithDelay("Я не вижу тебя, где ты?");
						}
					} else if (responseMessage === "stop looking") {
						lookTarget = null;
						sendMessageWithDelay("Больше не смотрю на тебя.");
					} else {
						sendMessageWithDelay(responseMessage);
					}
				} catch (error) {
					console.error("Ошибка при обработке сообщения:", error.message);
					sendMessageWithDelay(
						"Произошла ошибка при обработке сообщения: " + error.message
					);
				}
			});
		});

		bot.on("error", err => {
			console.error("Ошибка бота:", err.message);
			sendMessageWithDelay("Произошла ошибка: " + err.message);
		});

		bot.on("end", () => {
			console.log("Бот отключился.");
			// Очищаем память сессии при отключении бота
			sessionMemory = [{ role: "system", content: systemMessage }];
			// Переподключаем бота через 5 секунд
			setTimeout(() => {
				console.log("Переподключаем бота...");
				Main();
			}, 5000);
		});

		bot.on("kicked", (reason: string) => {
			console.error("Бот был кикнут:", reason);
			sendMessageWithDelay("Меня кикнули: " + reason);
			// Переподключаем бота через 5 секунд
			setTimeout(() => {
				console.log("Переподключаем бота...");
				Main();
			}, 5000);
		});

		bot.on("death", () => {
			console.error("Бот умер.");
			sendMessageWithDelay("Я умер...");
		});
	} catch (error) {
		console.error("Ошибка инициализации:", error.message);
	}
}

// Функция для начала следования за игроком
function startFollowing() {
	if (!followTarget) return;

	const movements = new Movements(bot);
	bot.pathfinder.setMovements(movements);

	// Обновляем цель каждую секунду
	const interval = setInterval(() => {
		if (!followTarget) {
			clearInterval(interval); // Останавливаем интервал, если цель потеряна
			return;
		}

		// Устанавливаем новую цель (следовать за игроком)
		const goal = new goals.GoalFollow(followTarget, 1); // 1 — расстояние, на котором бот будет держаться
		bot.pathfinder.setGoal(goal, true);
	}, 1000);
}

// Функция для начала "смотрения" на игрока
function startLooking() {
	if (!lookTarget) return;

	// Обновляем взгляд каждые 100 мс
	const interval = setInterval(() => {
		if (!lookTarget) {
			clearInterval(interval); // Останавливаем интервал, если цель потеряна
			return;
		}

		// Направляем взгляд бота на игрока
		const targetPos = lookTarget.position;
		bot.lookAt(targetPos);
	}, 100);
}

Main();

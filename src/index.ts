import * as dotenv from 'dotenv';
dotenv.config();
import puppeteer from 'puppeteer';

// Récupération des identifiants et paramètres depuis .env
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const DEV_MODE = process.env.DEV_MODE === 'true' || false;
const TARGET_URL =
	process.env.TARGET_URL || 'https://aide-serveur.fr/ressources/';
const RESOURCE = process.env.RESOURCE;

if (!RESOURCE) {
	console.error(
		'❌ Veuillez définir RESOURCE dans votre .env (ex: test.4571)'
	);
	process.exit(1);
}
const UPDATE_VERSION = process.env.UPDATE_VERSION;
const UPDATE_MSG = process.env.UPDATE_MSG;

if (!EMAIL || !PASSWORD) {
	console.error(
		'❌ Veuillez définir EMAIL et PASSWORD dans votre fichier .env'
	);
	process.exit(1);
}
if (!UPDATE_VERSION || !UPDATE_MSG) {
	console.error(
		'❌ Veuillez définir UPDATE_VERSION et UPDATE_MSG dans votre fichier .env'
	);
	process.exit(1);
}

(async () => {
	const browser = await puppeteer.launch({
		headless: !DEV_MODE,
		slowMo: 15,
		devtools: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--window-position=1920,0',
			'--window-size=1920,1080',
		],
	});

	const page = await browser.newPage();
	await page.setViewport({ width: 1920, height: 1080 });

	// 1) Accès initial à la page resources
	await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
	console.log('✅ Navigateur ouvert sur', TARGET_URL);

	// 2) Authentification
	await page.click('span.p-navgroup-link--logIn');
	await page.waitForSelector('input[name="login"]', { timeout: 5000 });
	// Clear et saisie email
	await page.$eval('input[name="login"]', (el: any) => {
		el.value = '';
	});
	await page.type('input[name="login"]', EMAIL, { delay: 15 });
	// Clear et saisie password
	await page.$eval('input[name="password"]', (el: any) => {
		el.value = '';
	});
	await page.type('input[name="password"]', PASSWORD, { delay: 15 });
	await page.click('button.button--icon--login');
	// Attendre la disparition du bouton Connexion
	await page.waitForSelector('span.p-navgroup-link--logIn', {
		hidden: true,
		timeout: 10000,
	});
	console.log('🔓 Authentification réussie !');

	// 3) Aller à la page de la ressource
	const resourceUrl = `https://aide-serveur.fr/ressources/${RESOURCE}`;
	try {
		await page.goto(resourceUrl, {
			waitUntil: 'networkidle2',
			timeout: 60000,
		});
	} catch (e) {
		console.error(
			`❌ Impossible de charger la ressource dans les temps : ${resourceUrl}`
		);
		process.exit(1);
	}
	console.log('➡️ Ouverture de la ressource :', resourceUrl);

	// 4) Cliquer sur “Poster une mise à jour”
	await page.waitForSelector('a.button[href$="/post-update"]', {
		timeout: 5000,
	});
	await page.click('a.button[href$="/post-update"]');
	await page.waitForSelector('input[name="update_title"]', {
		timeout: 10000,
	});

	// 5) Remplir le formulaire de mise à jour
	// Titre
	await page.$eval('input[name="update_title"]', (el: any) => {
		el.value = '';
	});
	await page.type('input[name="update_title"]', UPDATE_VERSION, {
		delay: 15,
	});

	// Message WYSIWYG
	await page.$eval(
		'div.fr-element[contenteditable="true"]',
		(el: any, msg: string) => {
			el.textContent = msg;
		},
		UPDATE_MSG
	);

	// Nouvelle version
	await page.click('input[name="new_version"]');
	await page.$eval('input[name="version_string"]', (el: any) => {
		el.value = '';
	});
	await page.type('input[name="version_string"]', UPDATE_VERSION, {
		delay: 15,
	});

	console.log('✅ Formulaire de mise à jour rempli avec', UPDATE_VERSION);

	// 6) Sauvegarder
	await page.click('button.button--icon--save');
	await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
	console.log('💾 Mise à jour sauvegardée avec succès');

	// Fin du script
})();

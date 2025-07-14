import * as dotenv from 'dotenv';
dotenv.config();
import puppeteer from 'puppeteer';

const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const DEV_MODE = process.env.DEV_MODE === 'true' || false;
const TARGET_URL =
	process.env.TARGET_URL || 'https://aide-serveur.fr/ressources/';
const RESOURCE = process.env.RESOURCE;
const EXTERNAL_URL = process.env.EXTERNAL_URL;
const ARTIFACT_PATH = process.env.ARTIFACT_PATH;

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
	let browser;
	if (DEV_MODE) {
		browser = await puppeteer.launch({
			headless: false,
			slowMo: 15,
			devtools: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--window-position=1920,0',
				'--window-size=1920,1080',
			],
		});
	} else {
		browser = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--window-size=1920,1080',
			],
		});
	}

	const page = await browser.newPage();
	await page.setViewport({ width: 1920, height: 1080 });

	await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
	console.log('✅ Navigateur ouvert sur', TARGET_URL);

	await page.click('span.p-navgroup-link--logIn');
	await page.waitForSelector('input[name="login"]', { timeout: 5000 });
	await page.$eval('input[name="login"]', (el: any) => {
		el.value = '';
	});
	await page.type('input[name="login"]', EMAIL, { delay: 15 });
	await page.$eval('input[name="password"]', (el: any) => {
		el.value = '';
	});
	await page.type('input[name="password"]', PASSWORD, { delay: 15 });
	await page.click('button.button--icon--login');
	await page.waitForSelector('span.p-navgroup-link--logIn', {
		hidden: true,
		timeout: 10000,
	});
	console.log('🔓 Authentification réussie !');

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

	await page.waitForSelector('a.button[href$="/post-update"]', {
		timeout: 5000,
	});
	await page.click('a.button[href$="/post-update"]');
	await page.waitForSelector('input[name="update_title"]', {
		timeout: 10000,
	});

	await page.$eval('input[name="update_title"]', (el: any) => {
		el.value = '';
	});
	await page.type('input[name="update_title"]', UPDATE_VERSION, {
		delay: 15,
	});

	await page.$eval(
		'div.fr-element[contenteditable="true"]',
		(el: any, msg: string) => {
			el.textContent = msg;
		},
		UPDATE_MSG
	);

	await page.click('input[name="new_version"]');
	await page.$eval('input[name="version_string"]', (el: any) => {
		el.value = '';
	});
	await page.type('input[name="version_string"]', UPDATE_VERSION, {
		delay: 15,
	});

	console.log('✅ Formulaire de mise à jour rempli avec', UPDATE_VERSION);

	if (EXTERNAL_URL) {
		// click the “external” radio
		await page.click('input[name="version_type"][value="external"]');
		// wait for the URL input to become enabled
		await page.waitForSelector(
			'input[name="external_download_url"]:not([disabled])',
			{ timeout: 5000 }
		);
		// clear & fill
		await page.$eval(
			'input[name="external_download_url"]',
			(el: any) => (el.value = '')
		);
		await page.type('input[name="external_download_url"]', EXTERNAL_URL, {
			delay: 15,
		});
		console.log('🔗 External URL set to', EXTERNAL_URL);
	} else if (ARTIFACT_PATH) {
		// click the “local” radio
		await page.click('input[name="version_type"][value="local"]');
		// wait for the file input to become visible
		const [fileChooser] = await Promise.all([
			page.waitForFileChooser({ timeout: 5000 }),
			page.click('a.js-attachmentUpload'), // opens the native file picker
		]);
		await fileChooser.accept([ARTIFACT_PATH]);
		console.log('📦 Artifact uploaded from', ARTIFACT_PATH);
	} else {
		console.log(
			'⚠️ No EXTERNAL_URL or ARTIFACT_PATH provided; skipping download/source selection.'
		);
	}

	await page.click('button.button--icon--save');
	await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
	console.log('💾 Mise à jour sauvegardée avec succès');

	if (DEV_MODE) {
		console.log(
			'🛑 DEV_MODE actif : le navigateur reste ouvert. Fermez-le manuellement pour terminer.'
		);
	} else {
		await browser.close();
		console.log('✅ Script terminé avec succès');
		process.exit(0);
	}
})();

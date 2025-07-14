import * as dotenv from 'dotenv';
dotenv.config();
import puppeteer from 'puppeteer';

const EMAIL = process.env.EMAIL!;
const PASSWORD = process.env.PASSWORD!;
const DEV_MODE = process.env.DEV_MODE === 'true';
const TARGET_URL =
	process.env.TARGET_URL || 'https://aide-serveur.fr/ressources/';
const RESOURCE = process.env.RESOURCE!;
const EXTERNAL_URL = process.env.EXTERNAL_URL;
const ARTIFACT_PATH = process.env.ARTIFACT_PATH;

if (!RESOURCE) {
	console.error(
		'❌ Veuillez définir RESOURCE dans votre .env (ex: test.4571)'
	);
	process.exit(1);
}
const UPDATE_VERSION = process.env.UPDATE_VERSION!;
const UPDATE_MSG = process.env.UPDATE_MSG!;
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
		slowMo: DEV_MODE ? 15 : 0,
		devtools: DEV_MODE,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--window-size=1920,1080',
			...(DEV_MODE ? ['--window-position=1920,0'] : []),
		],
	});

	const page = await browser.newPage();
	await page.setViewport({ width: 1920, height: 1080 });

	// 1) Go to list page
	await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
	console.log('✅ Navigateur ouvert sur', TARGET_URL);

	// 2) Log in
	await page.click('span.p-navgroup-link--logIn');
	await page.waitForSelector('input[name="login"]', { timeout: 5000 });
	await page.click('input[name="login"]', { clickCount: 3 });
	await page.type('input[name="login"]', EMAIL, { delay: 15 });
	await page.click('input[name="password"]', { clickCount: 3 });
	await page.type('input[name="password"]', PASSWORD, { delay: 15 });
	await page.click('button.button--icon--login');
	await page.waitForSelector('span.p-navgroup-link--logIn', {
		hidden: true,
		timeout: 10000,
	});
	console.log('🔓 Authentification réussie !');

	// 3) Navigate to the resource update page
	const resourceUrl = `${TARGET_URL}${RESOURCE}`;
	try {
		await page.goto(resourceUrl, {
			waitUntil: 'networkidle2',
			timeout: 60000,
		});
	} catch {
		console.error(
			`❌ Impossible de charger la ressource dans les temps : ${resourceUrl}`
		);
		process.exit(1);
	}
	console.log('➡️ Ouverture de la ressource :', resourceUrl);

	// small delay to ensure dynamic widgets finish loading
	await page.waitForTimeout(1000);

	// click the “Post update” button
	await page.waitForSelector('a.button[href$="/post-update"]', {
		timeout: 5000,
	});
	await page.click('a.button[href$="/post-update"]');

	// wait for the form
	await page.waitForSelector('input[name="update_title"]', {
		timeout: 10000,
	});

	// fill title
	await page.click('input[name="update_title"]', { clickCount: 3 });
	await page.type('input[name="update_title"]', UPDATE_VERSION, {
		delay: 15,
	});

	// 4) wait *explicitly* for the rich-text editor
	await page.waitForSelector('div.fr-element[contenteditable="true"]', {
		visible: true,
		timeout: 10000,
	});

	// fill message
	await page.$eval(
		'div.fr-element[contenteditable="true"]',
		(el: HTMLElement, msg: string) => {
			el.textContent = msg;
		},
		UPDATE_MSG
	);

	// fill version field
	await page.click('input[name="new_version"]');
	await page.click('input[name="version_string"]', { clickCount: 3 });
	await page.type('input[name="version_string"]', UPDATE_VERSION, {
		delay: 15,
	});

	console.log('✅ Formulaire de mise à jour rempli avec', UPDATE_VERSION);

	// 5) handle download source
	if (EXTERNAL_URL) {
		await page.click('input[name="version_type"][value="external"]');
		await page.waitForSelector(
			'input[name="external_download_url"]:not([disabled])',
			{ timeout: 5000 }
		);
		await page.click('input[name="external_download_url"]', {
			clickCount: 3,
		});
		await page.type('input[name="external_download_url"]', EXTERNAL_URL, {
			delay: 15,
		});
		console.log('🔗 External URL set to', EXTERNAL_URL);
	} else if (ARTIFACT_PATH) {
		await page.click('input[name="version_type"][value="local"]');
		const [fileChooser] = await Promise.all([
			page.waitForFileChooser({ timeout: 5000 }),
			page.click('a.js-attachmentUpload'),
		]);
		await fileChooser.accept([ARTIFACT_PATH]);
		console.log('📦 Artifact uploaded from', ARTIFACT_PATH);
	} else {
		console.log(
			'⚠️ No EXTERNAL_URL or ARTIFACT_PATH provided; skipping download/source selection.'
		);
	}

	// 6) submit
	await page.click('button.button--icon--save');
	await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
	console.log('💾 Mise à jour sauvegardée avec succès');

	// 7) done
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

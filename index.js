function getTodaySeed() {
	const d = new Date();
	const year = d.getUTCFullYear();
	const month = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return parseInt(`${year}${month}${day}`, 10);
}

function openAccountModal() {
	document.getElementById('account-modal').showModal();
}

function closeAccountModal() {
	document.getElementById('account-modal').close();
}


async function reloadUserStatus() {

	let user = localStorage.getItem('user');
	if (user === null) {

		// action required


	}
	else {

		// get Codeforces status
		
		
		
		
		if (doCodeforcesUser(user)) {

		}
		


	}



}






class Voter {

	log() {
		console.log('[LOG]', ...arguments);
	}

	isEnd() {
		let resultNumber = Object.keys(this.result).length;
		let alivePlayerNumber = 0;
		for (let player of this.game.playerList) {
			if (player.alive) {
				alivePlayerNumber += 1;
			}
		}

		this.log('result', this.result);
		this.log(resultNumber, '/', alivePlayerNumber);

		if (alivePlayerNumber === resultNumber) {
			return true;
		} else {
			return false;
		}
	}

	vote(player, targetPlayer) {
		if (!this.resolver || !this.rejecter) {
			player.send('投票未开始');
			return;
		}
		if (!player.alive) {
			player.send('你已出局，没有投票权限');
			return;
		}
		if (!targetPlayer || !targetPlayer.alive) {
			player.send('投票不合法');
			return;
		}

		if (Object.keys(this.result).includes(String(player.id))) {
			player.send('你已经投票 / 弃权过了');
			return;
		}

		this.log('Vote', player.displayName, 'To', targetPlayer.displayName);

		this.result[String(player.id)] = targetPlayer;
		player.send(`你投票给了 ${targetPlayer.displayName}`);
		if (this.isEnd()) {
			this.end();
		}
	}

	pass(player) {
		if (!this.resolver || !this.rejecter) {
			player.send('投票未开始');
			return;
		}
		if (!player.alive) {
			player.send('你没有投票权限');
			return;
		}

		if (Object.keys(this.result).includes(String(player.id))) {
			player.send('你已经投票 / 弃权过了');
			return;
		}

		this.log('Pass', player.displayName);

		this.result[String(player.id)] = null;
		player.send('你放弃了你的投票权');
		if (this.isEnd()) {
			this.end();
		}
	}

	next() {
		if (this.resolver || this.rejecter) {
			console.error('ERROR! A vote is already started!');
		}

		this.started = true;
		this.result = {};
		return new Promise((resolve, reject) => {
			this.resolver = resolve;
			this.rejecter = reject;
		});
	}

	end() {
		let voteCounter = {};
		let countResult = [];
		for (let playerId in this.result) {
			const targetPlayer = this.result[playerId];
			if (targetPlayer) {
				if (voteCounter[targetPlayer.id]) {
					voteCounter[targetPlayer.id] += 1;
					countResult[targetPlayer.id].push(this.game.getPlayer(playerId));
				} else {
					voteCounter[targetPlayer.id] = 1;
					countResult[targetPlayer.id] = [this.game.getPlayer(playerId)];
				}
			}
		}
		this.log('End', voteCounter);

		let response = null;
		let maxVoteNumber = -1;
		for (let targetPlayerId in voteCounter) {
			let voteNumber = voteCounter[targetPlayerId];
			this.log('>', targetPlayerId, voteNumber);
			if (voteNumber > maxVoteNumber) {
				maxVoteNumber = voteNumber;
				response = this.game.getPlayer(targetPlayerId);
			} else if (voteNumber == maxVoteNumber) {
				response = null;
			}
		}
		this.log(response, maxVoteNumber);

		this.game.logger.listVotes(this.result, countResult);

		this.started = false;
		this.resolver(response);
		this.resolver = undefined;
		this.rejecter = undefined;
	}

	constructor(game) {
		this.game = game;
		this.started = false;
	}
}

module.exports = Voter;
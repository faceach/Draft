var Skill = {
    log: (msg = '') => {
        if (console) {
            console.log(`===>>> ${msg} <<<===`);
        }
    },
    addSuffix: (msg = '') => {
        return msg += '_Skill';
    }
};

module.exports = Skill;

class DialogStage {
	startStage
	activeStage
	prevStage
	observers = []
	validator = new ChangeStageValidator(this)

	constructor() {
		this.activeStage = this.getActiveStage()
		this.startStage = this.activeStage
		this.prevStage = null
		this.addObservers()
	}

	addObservers() {
		this.observers.push(new StepAgainButtonStyleController(document.querySelector('#step-back'), this))
	}

	getActiveStage() {
		return (this.activeStage) ? this.activeStage : document.querySelector('.dialog__stage.active')
	}

	setActiveStage(stage) {
		if (!this.validator.validate()) {
			alert('Необходимо заполнить все поля для ввода текста')
			return
		}

		let newActiveStage = stage
		if (newActiveStage === this.activeStage) return
		if (this.activeStage) this.activeStage.classList.remove('active')
		this.prevStage = this.activeStage
		this.activeStage = newActiveStage
		this.activeStage.classList.add('active')
		this.notifyObservers()
	}

	startAgain() {
		if (!this.startStage || !this.activeStage) return
		this.activeStage.classList.remove('active')
		this.activeStage = this.startStage
		this.prevStage = null
		this.activeStage.classList.add('active')
		this.notifyObservers()
	}

	stepBack() {
		if (!this.prevStage || !this.activeStage) return
		this.activeStage.classList.remove('active')
		this.activeStage = this.prevStage
		this.prevStage = null
		this.activeStage.classList.add('active')
		this.notifyObservers()
	}

	notifyObservers() {
		this.observers.forEach(e => e.update())
	}
}


class ChangeStageValidator {
	constructor(controller) {
		this.controller = controller
	}

	validate() {
		let flag = true
		flag = this.check_input_fields_filled() && flag
		return flag
	}

	check_input_fields_filled() {
		let fields = this.controller.activeStage.querySelectorAll('input.billet-item')
		for (let field of fields) {
			if (field.value.length === 0) {
				return false
			}
		}
		return true
	}
}

// ------------------------------------------------------------------------------------------
// Базовый класс для управлением состояниями
class BaseStyleController {
	state
	lead
	slave

	update() {this.state.update()}
	setState() {}
}

// Базовый класс состояния
class BaseState {
	update() {}
}
// ------------------------------------------------------------------------------------------


class StepAgainButtonStyleController extends BaseStyleController {
	activeState = new StepAgainButtonActiveState(this)
	disabledState = new StepAgainButtonDisabledState(this)

	constructor(slave, lead=null) {
		super();
		this.slave = slave
		this.lead = lead
		this.setState()
	}

	setState() {
		super.setState()
		if (!this.state) this.state = this.disabledState
		else if (this.state === this.activeState) this.state = this.disabledState
		else this.state = this.activeState
		this.state.activateState()
	}
}


class StepAgainButtonActiveState extends BaseState {
	controller
	classes = ['btn-navigation']

	constructor(controller) {
		super();
		this.controller = controller
	}

	update() {
		if (!this.controller.lead.prevStage && this.controller.state === this) {
			this.classes.forEach(e => this.controller.slave.classList.remove(e))
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.slave.classList.add(e))
	}
}

class StepAgainButtonDisabledState extends BaseState {
	controller
	classes = ['btn-navigation__disabled']

	constructor(controller) {
		super();
		this.controller = controller
	}

	update() {
		if (this.controller.lead.prevStage && this.controller.state === this) {
			this.classes.forEach(e => this.controller.slave.classList.remove(e))
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.slave.classList.add(e))
	}
}


function setDynamicValue(event) {
	document.querySelectorAll(`span[data-target=${event.target.dataset.target}]`).forEach(e => e.innerHTML = event.target.value)
	document.querySelectorAll(`input[data-target=${event.target.dataset.target}]`).forEach(e => e.value = event.target.value)
}

function copyDynamicFieldValue(id) {
	navigator.clipboard.writeText(document.querySelector(`#${id}`).value).then(() => {})
}

function startAgainScript() {
	if (confirm('Будет начат новый диалог и сброшены значения динамичных полей')) {
		dialogStage.startAgain()
		document.querySelectorAll('.dynamic-field__input.changeable').forEach(e => {
			e.value = ''
			document.querySelectorAll(`span.billet-item[data-target=${e.dataset.target}]`).forEach(e => e.innerHTML = '')
			document.querySelectorAll(`input.billet-item[data-target=${e.dataset.target}`).forEach(e => e.value = '')
		})
	}
}

let dialogStage
document.addEventListener('DOMContentLoaded', () => {
	dialogStage = new DialogStage()
	document.querySelectorAll(`input[data-target]`).forEach(e => e.addEventListener('keyup', setDynamicValue))
})

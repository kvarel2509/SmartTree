class DialogStage {
	startStage
	activeStage
	prevStage
	observers = []

	constructor() {
		this.activeStage = this.getActiveStage()
		this.startStage = this.activeStage
		this.prevStage = null
		this.addObservers()
	}

	addObservers() {
		this.observers.push(new StepAgainButtonStyleController(document.querySelector('#step-back'), this))
		document.querySelectorAll('.dynamic-field__input').forEach(e => {
			this.observers.push(new DynamicFieldInputStyleController(e, this))
		})
	}

	getActiveStage() {
		return (this.activeStage) ? this.activeStage : document.querySelector('.dialog__stage.active')
	}

	setActiveStage(stage) {
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


class DynamicFieldInputStyleController extends BaseStyleController{
	requiredState = new DynamicFieldInputRequiredState(this)
	normalState = new DynamicFieldInputNormalState(this)

	constructor(slave, lead=null) {
		super();
		this.slave = slave
		this.lead = lead
		this.setState()
	}

	setState() {
		super.setState()
		if (!this.state) {
			this.state = (this.lead.activeStage.dataset.requestFill.includes(this.slave.id)) ? this.requiredState : this.normalState
		}
		else if (this.state === this.requiredState) this.state = this.normalState
		else this.state = this.requiredState
		this.state.activateState()
	}
}


class DynamicFieldInputRequiredState extends BaseState{
	controller
	classes = ['dynamic-field__input-required']

	constructor(controller) {
		super();
		this.controller = controller
	}

	update() {
		if (!this.controller.lead.activeStage.dataset.requestFill.includes(this.controller.slave.id) && this.controller.state === this) {
			this.classes.forEach(e => this.controller.slave.classList.remove(e))
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.slave.classList.add(e))
	}
}


class DynamicFieldInputNormalState extends BaseState {
	controller
	classes = []

	constructor(controller) {
		super();
		this.controller = controller
	}

	update() {
		if (this.controller.lead.activeStage.dataset.requestFill.includes(this.controller.slave.id) && this.controller.state === this) {
			this.classes.forEach(e => this.controller.slave.classList.remove(e))
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.slave.classList.add(e))
	}
}


function setDynamicValue(event) {
	document.querySelectorAll(`span.${event.target.id}`).forEach(e => e.innerHTML = event.target.value)
}

function copyDynamicFieldValue(id) {
	navigator.clipboard.writeText(document.querySelector(`#${id}`).value).then(() => {})
}

function startAgainScript() {
	if (confirm('Будет начат новый диалог и сброшены значения динамичных полей')) {
		dialogStage.startAgain()
		document.querySelectorAll('.dynamic-field__input').forEach(e => e.value = '')
	}
}

let dialogStage
document.addEventListener('DOMContentLoaded', () => {
	dialogStage = new DialogStage()
	document.querySelectorAll('.dynamic-field__input').forEach(e => e.addEventListener('keyup', setDynamicValue))
})

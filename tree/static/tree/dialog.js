class Subject {
	observers = []

	addObserver(observer) {
		this.observers.push(observer)
	}

	notifyObservers() {
		this.observers.forEach(e => e.update())
	}
}


class Observer {
	node
	subject

	constructor(node, subject) {
		this.subject = subject
		this.subject.addObserver(this)
		this.node = node
	}

	update() {}
}


class DialogStageModel extends Subject {
	startStage
	activeStage = null
	prevStage = []

	constructor(startStage) {
		super()
		this.startStage = startStage
	}

	setActiveStage(stage) {
		if (this.activeStage) this.prevStage.push(this.activeStage)
		this.activeStage = stage
		this.notifyObservers()
	}

	startAgain() {
		this.activeStage = this.startStage
		this.prevStage = []
		this.notifyObservers()
	}

	stepBack() {
		this.activeStage = this.prevStage.pop()
		this.notifyObservers()
	}

	hasPrevStage() {
		return this.prevStage.length > 0
	}
}


class DynamicFieldModel extends Subject {
	label
	value
	permanent

	constructor(label, value, permanent) {
		super()
		this.label = label
		this.value = value
		this.permanent = permanent
	}

	setValue(value) {
		this.value = value
		this.notifyObservers()
	}

	resetValue() {
		if (this.permanent) return
		this.value = ''
		this.notifyObservers()
	}
}


class InputDynamicFieldObserver extends Observer {
	update() {
		this.node.value = this.subject.value
	}
}


class SpanDynamicFieldObserver extends Observer {
	update() {
		this.node.innerHTML = this.subject.value
	}
}


class StepBackButtonObserver extends Observer {
	activeState = new StepBackButtonActiveState(this)
	disabledState = new StepBackButtonDisabledState(this)
	state = this.disabledState

	constructor(node, subject) {
		super(node, subject)
		this.state.activateState()
	}

	setState() {
		if (this.state === this.activeState) this.state = this.disabledState
		else this.state = this.activeState
		this.state.activateState()
	}

	update() {
		this.state.update()
	}
}


class StepBackButtonActiveState {
	controller
	classes = ['btn-navigation']

	constructor(controller) {
		this.controller = controller
	}

	update() {
		if (!this.controller.subject.hasPrevStage() && this.controller.state === this) {
			this.classes.forEach(e => this.controller.node.classList.remove(e))
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.node.classList.add(e))
	}
}


class StepBackButtonDisabledState {
	controller
	classes = ['btn-navigation__disabled']

	constructor(controller) {
		this.controller = controller
	}

	update() {
		if (this.controller.subject.hasPrevStage() && this.controller.state === this) {
			this.classes.forEach(e => this.controller.node.classList.remove(e))
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.node.classList.add(e))
	}
}


class TimerObserver extends Observer {
	activeNormalState = new TimerActiveNormalState(this)
	activeWarningState = new TimerActiveWarningState(this)
	activeAlertState = new TimerActiveAlertState(this)
	disabledState = new TimerDisabledState(this)
	state = this.disabledState
	timeFormatter = new TimeFormatter({minute: true, second: true, sep: ' : '})

	constructor(node, subject) {
		super(node, subject)
		this.state.activateState()
	}

	defineState() {
		if (!this.subject.timer) return this.disabledState
		else if (this.subject.second > 15) return  this.activeNormalState
		else if (this.subject.second > 0) return  this.activeWarningState
		else if (this.subject.second === 0) return this.activeAlertState
	}
	setState() {
		this.state = this.defineState()
		this.state.activateState()
	}

	update() {
		this.state.update()
		this.node.innerHTML = this.timeFormatter.formatTime(this.subject.second)
	}
}


class TimerActiveNormalState {
	controller
	classes = ['normal']

	constructor(controller) {
		this.controller = controller
	}

	update() {
		if (this.controller.defineState() !== this) {
			this.classes.forEach(e => this.controller.node.classList.remove(e))
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.node.classList.add(e))
	}
}


class TimerActiveWarningState {
	controller
	classes = ['warning']
	//TODO: при усложнении логики вынести sound в модель и контроллер
	sound = document.querySelector('#warning-sound')

	constructor(controller) {
		this.controller = controller
	}

	update() {
		if (this.controller.defineState() !== this) {
			this.classes.forEach(e => this.controller.node.classList.remove(e))
			this.sound.pause()
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.node.classList.add(e))
		this.sound.load()
		this.sound.loop = true
		this.sound.volume = 0.2
		this.sound.play()
	}
}


class TimerActiveAlertState {
	controller
	classes = ['alert']
	sound = document.querySelector('#alert-sound')

	constructor(controller) {
		this.controller = controller
	}

	update() {
		if (this.controller.defineState() !== this) {
			this.classes.forEach(e => this.controller.node.classList.remove(e))
			this.sound.pause()
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.node.classList.add(e))
		this.sound.load()
		this.sound.loop = true
		this.sound.play()
	}
}


class TimerDisabledState {
	controller
	classes = ['disable']

	constructor(controller) {
		this.controller = controller
	}

	update() {
		if (this.controller.defineState() !== this) {
			this.classes.forEach(e => this.controller.node.classList.remove(e))
			this.controller.setState()
		}
	}

	activateState() {
		this.classes.forEach(e => this.controller.node.classList.add(e))
	}
}


class DynamicFieldsController {
	groups = new Map()

	addGroup(label, value, permanent) {
		let model = new DynamicFieldModel(label, value, permanent)
		this.groups.set(label, model)
		return model
	}

	setValue(label, value) {
		if (!this.groups.has(label)) return
		this.groups.get(label).setValue(value)
	}

	reset() {
		this.groups.forEach(e => e.resetValue())
	}

	copyDynamicFieldValue(label) {
		navigator.clipboard.writeText(this.groups.get(label).value).then(() => {})
	}
}


class DialogStageController {
	validator
	dialogStageModel
	timerController

	constructor(dialogStageModel, startStage, timerController) {
		this.dialogStageModel = dialogStageModel
		this.validator = new ChangeStageValidator(this.dialogStageModel)
		this.timerController = timerController
		this.setActiveStage(startStage)
	}

	setActiveStage(stage) {
		if (this.dialogStageModel.activeStage === stage) return

		if (this.dialogStageModel.activeStage && !this.validator.validate(this.dialogStageModel.activeStage)) {
			alert('Необходимо заполнить все поля для ввода текста')
			return
		}

		this.dialogStageModel.activeStage?.classList.remove('active')
		this.dialogStageModel.setActiveStage(stage)
		this.dialogStageModel.activeStage.classList.add('active')
		this._checkTimer()
	}

	startAgain() {
		if (!confirm('Будет начат новый диалог и сброшены значения динамичных полей')) return
		this.dialogStageModel.activeStage?.classList.remove('active')
		this.dialogStageModel.startAgain()
		this.dialogStageModel.activeStage.classList.add('active')
		this._checkTimer()
	}

	stepBack() {
		if (!this.dialogStageModel.hasPrevStage()) return
		this.dialogStageModel.activeStage?.classList.remove('active')
		this.dialogStageModel.stepBack()
		this.dialogStageModel.activeStage.classList.add('active')
		this._checkTimer()
	}

	_checkTimer() {
		this.timerController.reset()
		if (this.dialogStageModel.activeStage.dataset.timer > 0) this.timerController.start(
			Number(this.dialogStageModel.activeStage.dataset.timer)
		)
	}
}


class ChangeStageValidator {
	model

	constructor(model) {
		this.model = model
	}

	validate() {
		let flag = true
		flag = this.check_input_fields_filled() && flag
		return flag
	}

	check_input_fields_filled() {
		let fields = this.model.activeStage.querySelectorAll('input.billet-item')

		for (let field of fields) {
			if (field.value.length === 0) {
				return false
			}
		}

		return true
	}
}


class TimerModel extends Subject {
	second = null
	timer = null

	start(second, step=-1) {
		this.second = second
		this.timer = setInterval(() => this.change(step), 1000)
	}

	stop() {
		clearInterval(this.timer)
		this.notifyObservers()
	}

	reset() {
		if (this.timer) clearInterval(this.timer)
		this.timer = null
		this.second = null
		this.notifyObservers()
	}

	change (step) {
		if (this.second <= 0) return this.stop()
		this.second += step
		this.notifyObservers()
	}
}


class TimeFormatter {
	matching = {day: 86400, hour: 3600, minute: 60, second: 1}
	format = {day: false, hour: false, minute: false, second: false, sep: '', padStart: 2}

	constructor(format={second: true, sep: ':'}) {
		Object.keys(format).forEach(e => {if (e in this.format) this.format[e] = format[e]})
	}

	formatTime(second) {
		let timeAsString = []
		Object.entries(this.matching).forEach(([key, value]) => {
			if (this.format[key]) {
				timeAsString.push(Math.floor(second / value).toString().padStart(this.format.padStart, 0))
				second %= value
			}
		})
		return timeAsString.join(this.format.sep)
	}
}


class TimerController {
	timerModel

	constructor(timerModel) {
		this.timerModel = timerModel
	}

	start(second) {
		this.timerModel.start(second)
	}

	stop() {
		this.timerModel.stop()
	}

	reset() {
		this.timerModel.reset()
	}
}


class Dialog {
	static dialogStageController
	static dynamicFieldsController
	static timerController

	static start() {
		// Инициализация контроллера таймера
		let timerModel = new TimerModel()
		new TimerObserver(document.querySelector('#timer'), timerModel)
		this.timerController = new TimerController(timerModel)

		// Инициализация контроллера шагов диалога
		let dialogStageModel = new DialogStageModel(document.querySelector('.dialog__stage.active'))
		this.dialogStageController = new DialogStageController(
			dialogStageModel,
			document.querySelector('.dialog__stage.active'),
			this.timerController,
		)
		new StepBackButtonObserver(document.querySelector('#step-back'), dialogStageModel)
		
		// Инициализация контроллера динамичных полей
		this.dynamicFieldsController = new DynamicFieldsController()
		document.querySelectorAll('.dynamic-field__input').forEach(e => {
			let group = this.dynamicFieldsController.addGroup(e.dataset.target, '', !e.classList.contains('changeable'))
			document.querySelectorAll(`[data-target=${group.label}]`).forEach(observer => {
				if (observer.tagName === 'SPAN') new SpanDynamicFieldObserver(observer, group)
				else if (observer.tagName === 'INPUT') new InputDynamicFieldObserver(observer, group)
			})
		})
	}
}


document.addEventListener('DOMContentLoaded', () => {
	Dialog.start()
})

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
    activeStage
    prevStage

    constructor(stage) {
		super()
        this.startStage = stage
        this.activeStage = stage
        this.prevStage = null
    }

    setActiveStage(stage) {
        this.prevStage = this.activeStage
        this.activeStage = stage
        this.notifyObservers()
    }

    startAgain() {
        this.activeStage = this.startStage
        this.prevStage = null
        this.notifyObservers()
    }

    stepBack() {
        this.activeStage = this.prevStage
        this.prevStage = null
        this.notifyObservers()
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
		if (!this.controller.subject.prevStage && this.controller.state === this) {
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
		if (this.controller.subject.prevStage && this.controller.state === this) {
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

	constructor(dialogStageModel) {
		this.dialogStageModel = dialogStageModel
		this.validator = new ChangeStageValidator(this.dialogStageModel)
	}

    setActiveStage(stage) {
        if (this.dialogStageModel.activeStage === stage) return 
		
        if (!this.validator.validate(this.dialogStageModel.activeStage)) {
			alert('Необходимо заполнить все поля для ввода текста')
			return
		}
		
        this.dialogStageModel.activeStage.classList.remove('active')
        this.dialogStageModel.setActiveStage(stage)
        this.dialogStageModel.activeStage.classList.add('active')
    }

    startAgain() {
        if (!confirm('Будет начат новый диалог и сброшены значения динамичных полей')) return
        
        this.dialogStageModel.activeStage.classList.remove('active')
        this.dialogStageModel.startAgain()
        this.dialogStageModel.activeStage.classList.add('active')
    }

    stepBack() {
        if (!this.dialogStageModel.prevStage) return
        this.dialogStageModel.activeStage.classList.remove('active')
        this.dialogStageModel.stepBack()
        this.dialogStageModel.activeStage.classList.add('active')
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


class Dialog {
	static dialogStageController
	static dynamicFieldsController

	static start() {
		// Инициализация контроллера шагов диалога
		let dialogStageModel = new DialogStageModel(document.querySelector('.dialog__stage.active'))
		this.dialogStageController = new DialogStageController(dialogStageModel)
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

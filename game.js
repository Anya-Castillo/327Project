const textElement = document.getElementById('text')
const optionBtnElement = document.getElementById('option-buttons')

let state = {}

function start(){
    state = {}
    showTextNode(1)
}

function showTextNode(textNodeIndex){
    const textNode = textNodes.find(textNode => textNode.id === textNodeIndex)
    textElement.innerText = textNode.text
    while(optionBtnElement.firstChild){
        optionBtnElement.removeChild(optionBtnElement.firstChild)
    }
    textNode.options.forEach(option => {
        if(showOption(option)){
            const button = document.createElement('button')
            button.innerText = option.text
            button.classList.add('btn')
            button.addEventListener('click', () => selectOpt(option))
            optionBtnElement.appendChild(button)
        }
    })
}

function showOption(option){
    return option.requiredState == null || option.requiredState(state)
}

function selectOpt(opt){
    const nextTextNodeId = opt.nextText
    if(nextTextNodeId <= 0){
        return start()
    }
    state = Object.assign(state, opt.setState)
    showTextNode(nextTextNodeId)
}

const textNodes = [
    {
        id: 1,
        text: 'You pull yourself out of the wreckage of your spaceship, surveying your surroundings you find that you have crash landed on an unknown planet. Your supplies are all scattered or destoryed and your radio no longer works. You need to Survive.',
        options:[
            {
                text: 'Look for food',
                nextText: 2
            },
            {
                text: 'Look for supplies',
                nextText: 3
            },
            {
                text: 'Try to fix the radio',
                nextText: 4
            }
        ]

    },
    //Start of choices stemming from 'look for food'
    {
        id: 2,
        text: 'You decide that you should look for food, but how should you proceed on this unknown planet?',
        options:[
            {
                text: 'Go hunting',
                nextText: 5
            },
            {
                text: 'Go gathering',
                nextText: 6
            }
        ]
    },
    {
        id: 5,
        text: 'You decide that you should go hunting. Where do you want to hunt?',
        options:[
            {
                text: 'The forest',
                nextText: 7
            },
            {
                text: 'The feild',
                nextText: 8
            }
        ]
    },
    {
        id: 7,
        text: 'You come across a hord of strange animal-like creatures, but they could be dangerous, what do you do?',
        options:[
            {
                text: 'Set a trap',
                nextText: 9
            },
            {
                text: 'Attack them',
                nextText: 10
            },
            {
                text: 'Ignore them',
                nextText: 14
            }
        ]
    },
    {
        id: 9,
        text: 'You set a trap and wait. After a while one of the creatures sets off the trap, scaring the rest away. You found food! Hopefully its not poisonous...',
        options:[
            {
                text: 'Continue',
                setState: {food: true},
                nextText: 11 //State 11 is the food, supplies, radio option but with restrictions
            }
        ]
    },
    {
        id: 10,
        text: 'You attack the hord, but there are too many and they overwhelm you. You are dead.',
    },
    {
        id: 8,
        text: 'In the distance you see a giant creature, and a bit closer you see many small rodent-like creatures, what do you do?',
        options:[
            {
                text: 'Attack the giant creature',
                setState: {food: true},
                nextText: 13,
            },
            {
                text: 'Attack the rodent-like creatures',
                nextText: 12
            },
            {
                text: 'Ignore them both',
                nextText: 14
            }
        ]
    },
    {
        id: 12,
        text: 'The creatures are too fast and you can\'t fight them off. You are dead.',
    },
    {
        id: 13,
        text: 'You succesfully attack the giant creature. You have food now!',
        options:[
            {
                text: 'continue',
                setState: {food: true},
                nextText: 11
            }
        ]
    },
    {
        id: 14,
        text: 'You ignore them and continue on your way, but you don\'t encounter any other potential food.',
        options:[
            {
                text: 'continue',
                nextText: 11
            }
        ]
    },
    {
        id: 6,
        text: 'You find a lake on the outskirts of the forest.',
        options: [
            {
                text: 'Go in the forest',
                nextText: 15
            },
            {
                text: 'Go fishing',
                setState: {fishing: true},
                nextText: 16
            }
        ]
    },
    {
        id: 16,
        text: 'You spent hours fishing but you caught nothing.',
        options: [
            {
                text: 'continue',
                nextText: 11
            }
        ]
    },
    {
        id: 15,
        text: 'In the forest you find nuts and berries.',
        options:[
            {
                text: 'continue',
                setState: {food: true},
                nextText: 11
            }
        ]
    },
    //Start of choices stemming from 'Look for supplies
    {
        id: 3,
        text: 'Your supplies that had been on your ship are scattered or destroyed, but you could try to salvage them or see if you could find anything useful nearby.',
        options: [
            {
                text: 'Look around wreckage',
                nextText: 17
            },
            {
                text: 'Look elsewhere',
                nextText: 18
            }
        ]
    },
    {
        id: 17,
        text: 'You look around the wreckage for a bit, but don\'t find much, but you still haven\'t checked inside the ship.',
        options:[
            {
                text: 'Continue looking around outside',
                nextText: 19
            },
            {
                text: 'Look inside the ship',
                nextText: 20
            }
        ]
    },
    {
        id: 19,
        text: 'You look around outside the ship and find a first aid kit that is still usable.',
        options: [
            {
                text: 'Continue',
                setState: {medical: true, supplies: true},
                nextText: 11
            }
        ]
    },
    {
        id: 20,
        text: 'You go inside the ship and find some tools and medical supplies that are barely untouched.',
        options: [
            {
                text: 'Continue',
                setState: {medical: true, tools: true, supplies: true},
                nextText: 11
            }
        ]
    },
    {
        id: 18,
        text: 'Thinking that most of your supplies are ruined you try to find supplies in nature.',
        options: [
            {
                text: 'Look in the woods',
                nextText: 21
            },
            {
                text: 'Look in the caves',
                nextText: 22
            },
            {
                text: 'Look on the beach',
                nextText: 23
            }
        ]
    },
    {
        id: 21,
        text: 'In the woods you gather logs and some stones.',
        options: [
            {
                text: 'Continue',
                setState: {supplies: true},
                nextText: 11
            }
        ]
    },
    {
        id: 22,
        text: 'You got lost in the caves and can\'t find your way out.',
    },
    {
        id: 23,
        text: 'You find stones and strange looking shells on the beach.',
        options: [
            {
                text: 'Continue',
                setState: {supplies: true},
                nextText: 11
            }
        ]
    },
    //Start of choices stemming from 'Try to fix the radio'
    {
        id: 4,
        text: 'The radio looks like it can be fixed, but you will need tools.',
        options: [
            {
                text: 'Fix the radio',
                requiredState: (currentState) => currentState.tools,
                setState: {radio: true},
                nextText: 25
            },
            {
                text: 'Why bother?',
                nextText: 26
            },
            {
                text: 'Try later',
                nextText: 11
            }
        ]
    },
    {
        id: 25,
        text: 'You fix the radio, who do you call for help?',
        options: [
            {
                text: 'Nearest ship',
                nextText: 27
            },
            {
                text: 'Your home space station',
                nextText: 28
            },
            {
                text: 'Earth',
                nextText: 29
            },
            {
                text: 'Nearest space station',
                nextText: 30
            }
        ]
    },
    {
        id: 26,
        text: 'You decide not to call for help.',
        options:[
            {
                text: 'Continue',
                requiredState: (currentState) => currentState.food && currentState.supplies,
                nextText: 33
            },
            {
                text: 'Continue',
                requiredState: (currentState) => !currentState.food || !currentState.supplies,
                nextText: 34
            }
        ]
    },
    {
        id: 27,
        text: 'You get in contact with the ship and they tell you they\'ll be there soon. When get there you find that they are a group of space pirates, and they say you can join them.',
        options: [
            {
                text: 'Join the pirates',
                nextText: 31
            },
            {
                text: 'No, you have morals',
                nextText: 32
            }
        ]
    },
    {
        id: 28,
        text: 'You contact your home space station, but they are unable to send anyone to help you. You are stuck.',
        options: [
            {
                text: 'Continue',
                requiredState: (currentState) => currentState.food && currentState.supplies,
                nextText: 33
            },
            {
                text: 'Continue',
                requiredState: (currentState) => !currentState.food || !currentState.supplies,
                nextText: 34
            }
        ]
    },
    {
        id: 33,
        text: 'Despite your circumstances, you are able to thrive on the new planet.',
    },
    {
        id: 34,
        text: 'Without any help coming and without proper supplies, you don\'t survive on the strange planet.',
    },
    {
        id: 31,
        text: 'You join the pirates and spend years pillaging and storming other ships and space stations.',
    },
    {
        id: 32,
        text: 'Your morals stop you from joining them and you become the pirate\'s captive, that is, until they abandon you on a desert planet.',
    },
    {
        id: 29,
        text: 'You try to contact Earth, but it\'s too far away, help is not coming.',
        options: [
            {
                text: 'Continue',
                requiredState: (currentState) => currentState.food && currentState.supplies,
                nextText: 33
            },
            {
                text: 'Continue',
                requiredState: (currentState) => !currentState.food || !currentState.supplies,
                nextText: 34
            }
        ]
    },
    {
        id: 30,
        text: 'You contact the nearest space station. They send help and you are rescued from the planet.',
    },
    //Kinda like the main choices
    {
        id: 11,
        text: 'You need to survive.',
        options: [
            {
                text: 'Look for food',
                requiredState: (currentState) => !currentState.food && !currentState.fishing,
                nextText: 2
            },
            {
                text: 'Look for supplies',
                requiredState: (currentState) => !currentState.medical && !currentState.tools && !currentState.supplies,
                nextText: 3
            },
            {
                text: 'Try to fix the radio',
                requiredState: (currentState) => !currentState.radio,
                nextText: 4
            }
        ]
    }    
]

start()
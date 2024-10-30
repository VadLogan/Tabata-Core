type TabataStatus = 'Done' | 'In Progress'
interface RoundStatus {
    tabataStatus: TabataStatus;
    roundNumber: number;
}

interface TabataConstructor {
    rounds: number[][]
    intermediateRoundCB: ()=> undefined;
    roundDoneCB: ()=> undefined;
    countCB: (count: number)=> undefined;
    getRoundStatus: (roundStatus: RoundStatus)=> undefined;

}

export class Tabata {
    private rounds: number[][] = [];
    private count: number = 0;
    private currentRound: number = 0;
    private intermediateRoundCB = ()=> undefined;
    private roundDoneCB = ()=> undefined;
    private countCB = (_: number)=> undefined;
    private getRoundStatus = (_: RoundStatus)=> undefined;

    constructor({
        rounds,
        intermediateRoundCB,
        roundDoneCB,
        countCB,
        getRoundStatus
    }: TabataConstructor){
    
        this.rounds = rounds;
        this.count = 0;
        this.currentRound = 0;
        this.intermediateRoundCB = intermediateRoundCB;
        this.roundDoneCB = roundDoneCB
        this.countCB = countCB
        this.getRoundStatus = getRoundStatus
    }

    start = () =>{
      const roundsToExecute = this.rounds.map(arrNum => {
          return async (roundNumber) =>  await  this._createRound(arrNum, roundNumber)
        });

     this._manageRounds(roundsToExecute)

    }
    // @arg: ()=> Promise[]
    _manageRounds = (roundsToExecute)=>{
        let roundNumber  = 0
        const startRound = async ()=> {
            if(roundNumber === roundsToExecute.length) {
                this.getRoundStatus({
                    tabataStatus: 'Done',
                    roundNumber
                })
                return
            }
            const round = roundsToExecute[roundNumber]
            roundNumber += 1
            const done = await round(roundNumber)
            if(done){
                await startRound()
            }
         }
         startRound()
    }

    // @arg: number[]
    _createRound = (arrNum, roundNumber) => {
        this.getRoundStatus({
            tabataStatus: 'In Progress',
            roundNumber
        })
        return new Promise((resolve)=>{
            this._manageRound(arrNum,roundNumber, resolve)
        })
    }

    _manageRound = (arrNum,roundNumber, resolve) => {
        if(arrNum.length === 1){
            const [delay] = arrNum
            this._setCounter(()=> {
                resolve(true)
                this.roundDoneCB()
            }, delay)
        }else {
            const [delay, ...rest] =  arrNum
            this._setCounter(()=> {
                this.getRoundStatus({
                    tabataStatus: 'In Progress',
                    roundNumber
                })
                this.intermediateRoundCB()
                this._manageRound(rest,roundNumber, resolve)
            }, delay)

        }
    }

    _setCounter = (callback, delay)=>{
        this.count = delay  / 1000
        this.countCB(this.count)
        const intervalId =  setInterval(()=>{
            this.count -= 1
            this.countCB(this.count)
        }, 1000)
        setTimeout(()=> {
            clearInterval(intervalId)
            callback()
        } , delay)
    }
}


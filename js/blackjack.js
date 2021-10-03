var blackjack = {
    debugger: false,
    
    mazo : [],
    casino: [],
    jugador: [],
    puntosCasino: 0,
    puntosJugador: 0,
    standCasino:false,
    standJugador: false,
    victoriaJugador: false,
    victoriaCasino: false,

    repartiendo: false,
    miTurno: true,

    safety: 17,

    dineroJugador : 1000,
    apuesta: 0,

    //corazones, diamantes, tréboles, picas.
    palos : ['C','D','T','P'],
    valores : ['0','1','2','3','4','5','6','7','8','9','J','Q','K'],
};

$(() => {

    //This take the id of each button and calls a function in case you click the button
    $('#deal').on('click', (ev) => {
        Game();
    });

    $('#hit').on('click', (ev) => {
        //Here there's a boolean that checks when the game is giving any card so you can't spam click
        if(!blackjack.repartiendo) hit();
    });

    $('#stand').on('click', (ev) => {
        stand();
    });

    updateMoney();
});

async function Game(){

    blackjack.apuesta = Number($('#apuesta').val());

    //Check if the bet/wager is a number or not before start the game.
    if(isNaN(blackjack.apuesta)){
        window.alert("Game wouldn't start until the Wager becomes a number.");
        return;
    }

    IniciarJuego();

    blackjack.dineroJugador -= blackjack.apuesta;

    updateMoney();

    //This gives one card switching the target (player or dealer).
    //blackjack.miTurno is a boolean which is true by default but changes with cambioTurno() then repartirCarta takes that boolean as value "turno"
    //and depending if it's true or false it takes the player or dealer selector.
    for(let i = 0; i < 3; i++){
        await delay(500);
        if(i !== 0) cambioTurno();
        repartirCarta();
    }
    
    //checkButtons change the disabled attribute of each button depending on a number 0, 1, 2, 3.
    checkButtons(1);

    //This checks if the player have a Blackjack and if so it stands.
    if(checkBlackjack()) stand();
}

async function hit(){
    blackjack.repartiendo = true;

    await delay(500);
    repartirCarta();

    blackjack.repartiendo = false;
    
    if( blackjack.puntosJugador > 21 ){
        stand();
    }
}

async function stand(){
    checkButtons(2);
    cambioTurno();
    await repartirCasino();
    endGame();
}

function IniciarJuego() {
    blackjack.puntosCasino = 0;
    blackjack.puntosJugador = 0;
    blackjack.standCasino = false;
    blackjack.standJugador = false;
    blackjack.victoriaCasino = false;
    blackjack.victoriaJugador = false;
    blackjack.repartiendo= false;
    blackjack.miTurno = true;
    blackjack.mazo = [];
    blackjack.casino = [];
    blackjack.jugador = [];

    //Create the deck
    for (let i = 0; i<blackjack.palos.length; i++){
        for ( let j = 0; j < blackjack.valores.length; j++){
            blackjack.mazo.push(blackjack.palos[i]+blackjack.valores[j]);
        }
    }

    //Mezclo el mazo
    for (let i = blackjack.mazo.length - 1; i>0; i--){
        let aleatorio = Math.floor(Math.random() * i);
        let temp = blackjack.mazo[i];
        blackjack.mazo[i] = blackjack.mazo[aleatorio];
        blackjack.mazo[aleatorio] = temp;
    }

    if(blackjack.debugger){
        console.log(blackjack.mazo);
    };

    checkButtons( 0 );
}

function ContarPuntos(arr) {
    var result = 0;
    var valor = '';    
    var temp = [];
    var valoresMano = [];
    let countAS = 0;

    for (let i = 0; i<arr.length; i++){
        temp = arr[i].split("");
        valor = temp[1];

        if(valor.match(/[2-9]/g)){
            valoresMano.push(parseInt(valor));
            continue;
        };

        if(valor.match(/[0JQK]/g)){
            valoresMano.push(10);
            continue;
        };

        if(valor.match(/1/g)){
            countAS += 1;
            valoresMano.push(11);
            continue;
        };
    };

    result = valoresMano.reduce ((acc, currentV)=>{
        return acc + currentV;
    });

    if( result > 21 && countAS > 0){
        for(let i = 0; i < countAS ; i++){
            if(result > 21){
                result -= 10;
            }else{
                break;
            }
        }
    }

    return result;
}

function repartirCarta(){
    const carta = blackjack.mazo.pop();
    const turno = blackjack.miTurno;
    const $tablero = $(`#${( turno ? 'player-cards' : 'dealer-cards' )}`);

    $tablero
        .append(`<img class="img-card" src="./img/deck/${ carta }.png" />`);

    blackjack[( turno ? 'jugador' : 'casino')].push(carta);
    
    if(blackjack[( turno ? 'jugador' : 'casino')].length > 5){
        $tablero.find('img').addClass('small');
    }

    blackjack[( turno ? 'puntosJugador' : 'puntosCasino')] = 
        ContarPuntos(blackjack[( turno ? 'jugador' : 'casino')]);

    $(`.${( turno ? 'player' : 'casino' )} > .letrero > h1 > span`)
        .text(' - '+ blackjack[( turno ? 'puntosJugador' : 'puntosCasino')])
}

function repartirCasino(){
    return new Promise(async (resolve) => {
        do{
            await delay(500);
            repartirCarta();
        } while( blackjack.puntosCasino < blackjack.safety );
        resolve();
    });
}

function cambioTurno(){
    blackjack.miTurno = !blackjack.miTurno;
}

function checkBlackjack(){
    const turno = blackjack.miTurno;
    const cartas = blackjack[( turno ? 'jugador' : 'casino')];
    const puntos = blackjack[( turno ? 'puntosJugador' : 'puntosCasino')];

    if( cartas.length === 2 && puntos === 21 ){
        return true;
    }
    return false;
}

function updateMoney(){
    $('.money').attr('data-value', blackjack.dineroJugador);
}

function checkButtons(state){

    //state 0 shows the play! button, remove child nodes of id player-cards and dealer-cards and creates the result h1 which is inside a div
    //state 1 shows buttons hit and stand
    //State 2 hides all the buttons
    //State 3 show the play! button
    if(state === 0){
        $(`#player-cards, #dealer-cards`).empty();
        $('#player-cards').append(`<div class="result hide"><h1></h1></div>`);
        
        $('#deal').attr('disabled', true);
        $('#hit').attr('disabled', true);
        $('#stand').attr('disabled', true);
    }else if( state === 1){
        $('#hit').attr('disabled', false);
        $('#stand').attr('disabled', false);
    }else if(state === 2){
        $('#deal').attr('disabled', true);
        $('#hit').attr('disabled', true);
        $('#stand').attr('disabled', true);
    }else if(state === 3){
        $('#deal').attr('disabled', false);
        $('#hit').attr('disabled', true);
        $('#stand').attr('disabled', true);
    }
}

function comparePoints(){
    const p = blackjack.puntosJugador;
    const c = blackjack.puntosCasino;
    let wd = p > 21;
    let wp = c > 21 && p <= 21;

    // 1 means player win
    // 0 it's a tie
    // -1 means player lose

    if(p === 21 && c === 21){
        if(blackjack.jugador.length === 2 && blackjack.casino.length !== 2){
            if(blackjack.debugger){
                console.log('Gana Jugador por Blackjack'); 
            };
            return 1;
        }
        if(blackjack.casino.length === 2 && blackjack.jugador.length !== 2 ){
            if(blackjack.debugger){
                console.log('Gana Casino por Blackjack'); 
            };
            return -1;
        }
        if(blackjack.debugger){
            console.log('Doble Blackjack'); 
        };
        return 0;
    }

    if((wd || wp) && !(wd && wp)){
        return wp ? 1 : -1;
    }
    return p > c ? 1 : p < c ? -1 : 0;
}

function endGame(){

    let comparation;    

    comparation = comparePoints();
    if( comparation === 0 ){
        blackjack.victoriaJugador = false;
        blackjack.victoriaCasino = false;
    } else{
        blackjack.victoriaJugador = comparation > 0;
        blackjack.victoriaCasino = comparation < 0;
    }

    if(comparation >= 0){
        blackjack.dineroJugador += blackjack.apuesta * ( comparation > 0 ? 2 : 1 );
    }

    if (blackjack.victoriaJugador) {
        $('.result').addClass('winner');
    } else if (blackjack.victoriaCasino){
        $('.result').addClass('loser');
    } else {
        $('.result').addClass('empate');
    }

    $('.result').removeClass('hide')
        .find('h1').text(blackjack.victoriaJugador 
            ? 'WIN!' 
            : ( blackjack.victoriaCasino ? 'LOSE!' : 'TIE!' )
        );
    checkButtons(3);
    updateMoney();

    if(blackjack.debugger){
        console.log('volver a jugar'); 
    };
}

function delay( ms = 0 ){
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}
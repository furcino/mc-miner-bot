import { Bot } from 'mineflayer';
import { IndexedData } from 'minecraft-data';
import { StateMachineWrapper } from './state-machine';
import minecraftData from 'minecraft-data';
import mineflayer from 'mineflayer';
import mineflayerPathfinder from 'mineflayer-pathfinder';

const bot: Bot = mineflayer.createBot({
  host: 'localhost',
  username: 'Bot',
  port: 59111,
  auth: 'offline',
  hideErrors: false,
});

bot.loadPlugin(mineflayerPathfinder.pathfinder);

let stateMachineWrapper: any = null;
let mcData: IndexedData;

bot.once('spawn', () => {
    console.log('spawned');
    bot.clearControlStates();
    mcData = minecraftData(bot.version)
    stateMachineWrapper = new StateMachineWrapper(bot, mcData);
})

bot.once('login', () => {
    console.log('logged in');
})

bot.on('error', console.log)

bot.on('kicked', (reason, loggedin) => {
    console.log(reason + ' - ' + loggedin);        
})

bot.on('end', () => {
    console.log('GAME ENDED');
})

bot.on('chat', (username, message, translate, jsonMsg) => console.log(username + ' - ' + message + ' - ' + jsonMsg));
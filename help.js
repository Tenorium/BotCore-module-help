import {MessageEmbed, MessageReaction} from "discord.js";
import AbstractModule from "../../core/abstractModule.js";
import CommandManager from "../../core/CommandManager/index.js";

const helps = [];

const MAX_PAGE_SIZE = 2;

/**
 *
 * @param page
 * @return {MessageEmbed}
 * @private
 */
const buildEmbed = (page) => {
    let sortedHelps = helps.sort((a, b) => (a ?? 0).toString().localeCompare((b ?? 0).toString()));
    let pagedHelps = sortedHelps.slice((MAX_PAGE_SIZE - 1) * (page - 1), ((MAX_PAGE_SIZE - 1) * page) + 1);

    let description = '';
    pagedHelps.forEach((value, index) => {
        description +=
            `**${value.name}**\n
            Использование: *${value.usage}*\n
            ${value.description}\n\n`;
    });

    let embed = new MessageEmbed();
    embed.setColor('YELLOW');
    embed.setDescription(description);
    return embed;
}

// const maxPages = () => {
//     helps
// }

export default class HelpModule extends AbstractModule {

    /**
     *
     * @param {string} command
     * @param {string} description
     * @param {string} usage
     */
    addCommandHelp(command, description, usage) {
        helps.push(
            {
                name: command,
                description: description,
                usage: usage
            });
    }

    load() {
        CommandManager.registerCommand('help', async(args, message) => {
            let embed = buildEmbed(1);

            /**
             *
             * @param {MessageReaction} reaction
             * @param {User} user
             */
            let filter = (reaction, user) => !user.bot && ['❌', '⬅', '➡'].includes(reaction.emoji.name);

            message.channel.send({
                embeds: [
                    embed
                ]
            }).then((newMessage) => {
                let page = 1;

                (async() => {
                    await newMessage.react('⬅');
                    await newMessage.react('❌');
                    await newMessage.react('➡');
                })();

                let collector = newMessage.createReactionCollector({filter});

                collector.on("collect", function (reaction, user) {
                    reaction.users.remove(user);
                    if (reaction.emoji.name === '⬅') {
                        if (page <= 1) {
                            return;
                        }
                        page--;
                    }

                    if (reaction.emoji.name === '➡') {
                        if (page >= (helps.length / MAX_PAGE_SIZE)) {
                            return;
                        }
                        page++;
                    }

                    if (reaction.emoji.name === '❌') {
                        collector.stop();
                        return;
                    }

                    newMessage.edit(
                        {
                            embeds: [
                                buildEmbed(page)
                            ]
                        }
                    );
                });

                collector.on('end', collected => {
                    newMessage.delete();
                });

            });
        });

        this.addCommandHelp('help', 'Show this message', 'help');
    }

    unload() {
    }
}
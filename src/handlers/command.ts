import { join } from 'path';
import { lstatSync, readdirSync } from 'fs';
import { SlashCommandBuilder } from '@discordjs/builders'
import { DiscordClient } from '..';
import { Command } from '../classes/command'
import { CommandInteraction } from 'discord.js';

class CommandHandler {

    private client: DiscordClient;
    private commands: Map<string, Command> = new Map();
    private slash: Array<any> = [];
    private beforeCommandData: Function;

    constructor(client: DiscordClient) {
        this.client = client;
        if (!this.client.command_path) return
        this.loadCommands().then(() => {
            this.listenCommands()
            if (this.client.create_commands) this.client.once('ready', () => this.setCommands(this.client.test_guild))
        })
    }

    private async loadCommands() {
        this.scanDir(this.client.command_path)
    }

    private async scanDir(dir: string) {
        var command_dir: any;
        var directory = readdirSync(join(require.main.path, dir))
        for (const dirfile of directory) {
            if (lstatSync(join(require.main.path, dir + '/' + dirfile)).isDirectory()) {
                var commandBase = new SlashCommandBuilder().setName(dirfile.split('.js')[0]).setDescription('Default Description')
                for (const dirfile2 of readdirSync(join(require.main.path, dir + '/' + dirfile))) {
                    var command: Command = new (await import(join(require.main.path, dir + '/' + dirfile + '/' + dirfile2))).default
                    var command_dir: any = (dir.split(process.env.COMMANDS_PATH)[1] + '/' + dirfile + '/' + command.name).replace(/\//g, '|').split('|'); command_dir.shift(); var command_dir = command_dir.join('|')
                    this.commands.set(command_dir, command)
                    if (command.global) commandBase.addSubcommand(() => command.getBuilder() as any)
                }
                if (commandBase.options.length > 0) this.slash.push(commandBase.toJSON())
            } else {
                var command: Command = new (await import(join(require.main.path, dir + '/' + dirfile))).default
                var command_dir: any = (dir.split(process.env.COMMANDS_PATH)[1] + '/' + command.name).replace(/\//g, '|').split('|'); command_dir.shift(); var command_dir = command_dir.join('|')
                this.commands.set(command_dir, command)
                if (command.global) this.slash.push(command.getBuilder().toJSON())
            }
        }
    }

    private async scanDirPrivate(data: Object) {
        var commands: any[] = []
        var command_dir: any;
        var dir: any = this.client.command_path
        var directory = readdirSync(join(require.main.path, dir))
        for (const dirfile of directory) {
            if (lstatSync(join(require.main.path, dir + '/' + dirfile)).isDirectory()) {
                var commandBase = new SlashCommandBuilder().setName(dirfile.split('.js')[0]).setDescription('Default Description')
                for (const dirfile2 of readdirSync(join(require.main.path, dir + '/' + dirfile))) {
                    var command: Command = new (await import(join(require.main.path, dir + '/' + dirfile + '/' + dirfile2))).default
                    var command_dir: any = (dir.split(process.env.COMMANDS_PATH)[1] + '/' + dirfile + '/' + command.name).replace(/\//g, '|').split('|'); command_dir.shift(); var command_dir = command_dir.join('|')
                    this.commands.set(command_dir, command)
                    commandBase.addSubcommand(() => command.getBuilder(data) as any)
                }
                commands.push(commandBase.toJSON())
            } else {
                var command: Command = new (await import(join(require.main.path, dir + '/' + dirfile))).default
                var command_dir: any = (dir.split(process.env.COMMANDS_PATH)[1] + '/' + command.name).replace(/\//g, '|').split('|'); command_dir.shift(); var command_dir = command_dir.join('|')
                this.commands.set(command_dir, command)
                commands.push(command.getBuilder(data).toJSON())
            }
        }
        return commands
    }

    private async setCommands(guild_id?: string) {
        this.client.application.commands.set(this.slash, guild_id)
    }

    public async registerCommands(guild_id: string, data: Object) {
        var commands = await this.scanDirPrivate(data)
        this.client.application.commands.set(commands, guild_id)
    }

    private async listenCommands() {
        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isCommand()) {
                switch (interaction.options.data[0]?.type) {
                    case 'SUB_COMMAND':
                        var command = `command|${interaction.commandName}|${interaction.options.getSubcommand()}`
                        break;
                    case 'SUB_COMMAND_GROUP':
                        var command = `command|${interaction.options.getSubcommand()}|${interaction.options.getSubcommandGroup()}|${interaction.commandName}`
                        break;
                    default:
                        var command = `command|${interaction.commandName}`
                        break;
                }

                if (!command) return interaction.reply({ content: this.client.messages.command_not_found })
                var class_command = this.commands.get(command)

                if (!this.checkPermissions(class_command, interaction)) return interaction.reply({ content: this.client.messages.invalid_permissions })

                class_command.execute(interaction)
            }
        })
    }

    private async checkPermissions(command: Command, interaction: CommandInteraction) {
        for (const permission of command.permissions) {
            if (interaction.memberPermissions.has(permission)) return true
        }
        return false
    }
}

export { CommandHandler }

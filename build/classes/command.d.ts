import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
interface CommandOptions {
    name: string;
    description: string;
    global?: boolean;
}
export default class Command {
    name: string;
    description: string;
    global: boolean;
    constructor(options: CommandOptions);
    protected getSubCommand(): SlashCommandSubcommandBuilder;
    protected getCommand(): SlashCommandBuilder;
    getBuilder(data?: any): SlashCommandBuilder | SlashCommandSubcommandBuilder;
    execute(interaction: CommandInteraction): void;
}
export { Command };
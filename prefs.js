import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class BringoutExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        const CustomText = () => {
            let textUrlEntry = new Gtk.Entry();
            textUrlEntry.set_width_chars(42);
            textUrlEntry.set_placeholder_text('Enter your text or leave it blank for extensions default text');

            textUrlEntry.set_text(window._settings.get_string('custom-text'));
            textUrlEntry.connect('changed', entry => {
                window._settings.set_string('custom-text', entry.get_text());
            });

            return textUrlEntry;
        };

        const page = new Adw.PreferencesPage();
        window.add(page);

        const group = new Adw.PreferencesGroup();
        page.add(group);

        const workSpaceIndicatorsRow = new Adw.SwitchRow({
            title: 'Hide Workspace Indicators',
        });
        group.add(workSpaceIndicatorsRow);

        const showCustomIndicatorsRow = new Adw.SwitchRow({
            title: 'Show Custom Indictors',
        });
        group.add(showCustomIndicatorsRow);

        const showCustomTextRow = new Adw.SwitchRow({
            title: 'Show Custom Text',
        });
        group.add(showCustomTextRow);

        const customText = new Adw.ActionRow({
            title: 'Custom Text',
        });
        customText.add_suffix(CustomText());
        group.add(customText);

        window._settings.bind('hide-work-space-indicators', workSpaceIndicatorsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-custom-text', showCustomTextRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-custom-indicators', showCustomIndicatorsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}

import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';

// helper functions

/**
 *
 * @param {object} button button
 * @param {string} id id
 * @param {object} settings settings
 */
export function setButtonColor(button, id, settings) {
    let rgba = new Gdk.RGBA();
    let hexString = settings.get_string(id) === '' ? '#ABCDEF00' : settings.get_string(id);
    rgba.parse(hexString);
    button.set_rgba(rgba);
}

/**
 *
 * @param {string} label label
 * @param {object} button button
 * @param {string} id id
 * @param {object} settings settings
 * @param {object} actionRow set_button_color
 */
export function colorButton(label, button, id, settings, actionRow) {
    let resetColorButton = new Gtk.Button();
    resetColorButton.set_label(label);
    resetColorButton.connect('clicked', () => {
        settings.set_string(id, '');
        setButtonColor(button, id, settings);
    });

    actionRow.add_suffix(selectButtonColor(button, id, settings));
    actionRow.add_suffix(resetColorButton);

    return actionRow;
}

/**
 *
 * @param {string} label button_label
 * @param {string} id schema_id
 * @param {string} predefinedString 'command to get different names'
 * @param {object} settings settings
 * @param {object} row entry_row
 */
export function createGtkButton(label, id, predefinedString, settings, row) {
    let gtkButton = new Gtk.Button();
    gtkButton.set_label(label);
    gtkButton.connect('clicked', () => {
        settings.set_string(id, predefinedString);
        row.set_text(settings.get_string(id));
    });

    return gtkButton;
}

/**
 *
 * @param {object} button 'button'
 * @param {string} id 'id'
 * @param {object} settings 'settings'
 */
function selectButtonColor(button, id, settings) {
    button.connect('notify::rgba', () => onPanelColorChanged(button, id, settings));
    return button;
}

/**
 *
 * @param {string } button 'button'
 * @param {string} id 'id'
 * @param {object} settings settings
 */
function onPanelColorChanged(button, id, settings) {
    let rgba = button.get_rgba();
    let css = rgba.to_string();
    let hex = RGBAToHexA(css);
    settings.set_string(id, hex);
}

// https://stackoverflow.com/a/73401564
/**
 *
 * @param {string} rgba rgba
 * @param {string} forceRemoveAlpha boolean
 */
function RGBAToHexA(rgba, forceRemoveAlpha = false) {
    return `#${rgba.replace(/^rgba?\(|\s+|\)$/g, '')
        .split(',')
        .filter((_, index) => !forceRemoveAlpha || index !== 3)
        .map(string => parseFloat(string))
        .map((number, index) => index === 3 ? Math.round(number * 255) : number)
        .map(number => number.toString(16))
        .map(string => string.length === 1 ? `0${string}` : string)
        .join('')}`;
}

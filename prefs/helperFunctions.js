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
 * @param {object} button button
 * @param {string} id id
 * @param {object} settings settings
 * @param {object} actionRow set button color
 */
export function colorButton(button, id, settings, actionRow) {
    let resetColorButton = new Gtk.Button();
    resetColorButton.set_label('Reset');
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
 * @param {object} settings settings
 * @param {string} id schema_id
 * @param {object} row entry row
 */
export function clearTextButton(settings, id, row) {
    let clearButton = new Gtk.Button();
    clearButton.set_label('Clear Text');
    clearButton.connect('clicked', () => {
        settings.set_string(id, '');
        row.set_text(settings.get_string(id));
    });

    return clearButton;
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

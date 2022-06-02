import axios from 'https://cdn.skypack.dev/axios';

export async function main(parent) {
    let versions = [{
        label: 'Douay-Rheims Version, Challoner Revision',
        key: 'drv'
    }]
    let {select} = element_select(parent, versions);
    element_on(select, 'change', on_version_change)
    await on_version_change();
    async function on_version_change() {
        let bible = await axios.get(`https://wlj-bible-public.web.app/${element_select_value(select)}_parsed.json`)
        console.log(bible);
    }
}

function element_select_value(select) {
    return select.options[select.selectedIndex].value;
}

function element_on(element, event_name, on_event) {
    element.addEventListener(event_name, on_event);
}

function element_select(parent, versions) {
    let select = element(parent, 'select');
    versions.forEach(version => {
        let option = element(select, 'option');
        element_html_inner_set(option, version.label);
        element_attribute_set(option, 'value', version.key);
    });
    return {
        select
    }
}

export function element_attribute_set(element, attribute, value) {
    element.setAttribute(attribute, value);
}

export function element_html_inner_set(element, text) {
    element.innerHTML = text;
}

export function element(parent, tag_name) {
    let result = document.createElement(tag_name);
    parent.appendChild(result);
    return result;
}
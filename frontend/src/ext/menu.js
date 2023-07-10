const menu = document.querySelector('body > nav');
const menuItems = document.querySelectorAll('body > nav > ul > li');
const subMenuItems = document.querySelectorAll('body > nav ul ul li');

function closeAllMenus() {
    const openMenus = document.querySelectorAll('body > nav li details[open]');
    openMenus.forEach(openMenu => openMenu.open = false);
}

document.addEventListener('click', event => {
    const clickedOnMenu = menu.contains(event.target);

    if(clickedOnMenu) return;

    closeAllMenus(); // Close all menus when a click is received elsewhere
});

menuItems.forEach(item => {
    item.addEventListener('mouseover', () => {
        const openMenu = document.querySelector('body > nav > ul > li > details[open]');
        
        if(!openMenu || item.contains(openMenu)) return;

        const nextMenu = item.querySelector('details');

        // Close all menus and open the next menu when hovered over
        closeAllMenus()
        if(nextMenu) nextMenu.open = true;
    });

    item.addEventListener('click', event => {
        const isSubMenu = event.target.parentElement.nodeName === 'SUMMARY';

        if(isSubMenu) return;

        closeAllMenus(); // Close all menus when a non-submenu item is clicked
    });
});

subMenuItems.forEach(item => {
    item.addEventListener('mouseenter', event => {
        if(event.target !== item) return;
        
        const itemMenu = item.querySelector('details');
        const parentUlMenus = item.parentElement.querySelectorAll('details');

        // Close all menus within the parent
        parentUlMenus.forEach(m => m.open = false);

        // If the hovered item is a menu, open it
        if(itemMenu) itemMenu.open = true;
    });
});
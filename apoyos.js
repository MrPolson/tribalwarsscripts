
/*
 * Script Name: Tribe Players Under Attack
 * Version: v1.2.4
 * Last Updated: 2024-06-06
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: N/A
 * Approved Date: 2021-05-24
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'tribePlayersUnderAttack',
        name: 'Tribe Players Under Attack',
        version: 'v1.2.4',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/tribe-players-under-attack-tribe-leader.287111/',
    },
    translations: {
        en_DK: {
            'Tribe Players Under Attack': 'Tribe Players Under Attack',
            Help: 'Help',
            'Error fetching player incomings!':
                'Error fetching player incomings!',
            Village: 'Village',
            Support: 'Support',
            'Villages under attack:': 'Villages under attack:',
            'No player is under attack!': 'No player is under attack!',
            'Player Name': 'Player Name',
            Incomings: 'Incomings',
            'Incs/Village Under Attack:': 'Incs/Village Under Attack:',
            'Incs/Total Village:': 'Incs/Total Village:',
            'There was an error!': 'There was an error!',
        },
        fr_FR: {
            'Tribe Players Under Attack': 'Joueur tribu sous attaque',
            Help: 'Aide',
            'Error fetching player incomings!':
                'Erreur chargement ordres entrants!',
            Village: 'Village',
            Support: 'Support',
            'No player is under attack!': 'Aucun joueur sous attaque!',
            'Player Name': 'Pseudo du joueur',
            Incomings: 'Entrants',
            'Incs/Village Under Attack:': 'Ordres/Village sous Attaque:',
            'Incs/Total Village:': 'Ordres/Total Village:',
            'There was an error!': 'Oupsi il y a eu une erreur!',
        },
        br_BR: {
            'Tribe Players Under Attack': 'Jogadores da tribo sobre ataque',
            Help: 'Ajuda',
            'Error fetching player incomings!':
                'Erro ao buscar dados dos jogadores!',
            Village: 'Aldeia',
            Support: 'Suporte',
            'No player is under attack!': 'Nenhum jogador sobre ataque!',
            'Player Name': 'Nome do jogador',
            Incomings: 'Entradas',
            'Incs/Village Under Attack:': 'Comandos/Aldeias sobre ataque:',
            'Incs/Total Village:': 'Comandos/Total das aldeias:',
            'There was an error!': 'Ops! Houve um erro!',
        },
    },
    allowedMarkets: [],
    allowedScreens: [],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();

        initTribePlayersUnderAttack();

        // Script Business Logic
        async function initTribePlayersUnderAttack() {
            const playersToFetch = await getTribeMembersList();

            if (playersToFetch.length) {
                const playersData = [...playersToFetch];
                const coordsRegex = twSDK.coordsRegex;
                const memberUrls = playersToFetch.map((item) => item.url);

                // Show progress bar and notify user
                twSDK.startProgressBar(memberUrls.length);

                twSDK.getAll(
                    memberUrls,
                    function (index, data) {
                        twSDK.updateProgressBar(index, memberUrls.length);

                        // parse reponse as html
                        const htmlDoc = jQuery.parseHTML(data);
                        const villagesTableRows = jQuery(htmlDoc)
                            .find(`.table-responsive table tr`)
                            .not(':first');
                        const totalPlayerVillagesCount =
                            villagesTableRows.length;

                        const villageIncs = [];

                        // parse player information
                        if (villagesTableRows && villagesTableRows.length) {
                            villagesTableRows.each(function () {
                                try {
                                    const _this = jQuery(this);
                                    const incomingsCount = parseInt(
                                        _this.find('td:last').text().trim()
                                    );
                                    if (incomingsCount > 0) {
                                        const currentVillageId = parseInt(
                                            twSDK.getParameterByName(
                                                'id',
                                                window.location.origin +
                                                    _this
                                                        .find('td:first a')
                                                        .attr('href')
                                            )
                                        );
                                        const currentVillageName = _this
                                            .find('td:first')
                                            .text()
                                            .trim();
                                        const currentVillageCoords = _this
                                            .find('td:first')
                                            .text()
                                            .trim()
                                            .match(coordsRegex)[0];

                                        let villageData = [];

                                        _this
                                            .find('td')
                                            .not(':first')
                                            .not(':last')
                                            .not(':eq(0)')
                                            .each(function () {
                                                const unitAmount =
                                                    jQuery(this)
                                                        .text()
                                                        .trim() !== '?'
                                                        ? jQuery(this)
                                                              .text()
                                                              .trim()
                                                        : 0;
                                                villageData.push(unitAmount);
                                            });

                                        villageData = villageData.splice(
                                            0,
                                            game_data.units.length
                                        );

                                        let villageTroops = [];
                                        game_data.units.forEach(
                                            (unit, index) => {
                                                villageTroops = {
                                                    ...villageTroops,
                                                    [unit]: villageData[index],
                                                };
                                            }
                                        );

                                        villageIncs.push({
                                            villageId: currentVillageId,
                                            villageName: currentVillageName,
                                            villageCoords: currentVillageCoords,
                                            incsCount: incomingsCount,
                                            troops: villageTroops,
                                        });
                                    }
                                } catch (error) {
                                    UI.ErrorMessage(
                                        twSDK.tt(
                                            'Error fetching player incomings!'
                                        )
                                    );
                                    console.error(
                                        `${scriptInfo} Error:`,
                                        error
                                    );
                                }
                            });
                        }

                        let totalIncs = villageIncs.map(
                            (incoming) => incoming.incsCount
                        );
                        totalIncs = parseInt(
                            twSDK.sumOfArrayItemValues(totalIncs)
                        );

                        // update players info
                        playersData[index] = {
                            ...playersData[index],
                            incomings: villageIncs,
                            totalPlayerVillages: Math.ceil(
                                totalPlayerVillagesCount / 2
                            ),
                            villagesUnderAttack: villageIncs.length,
                            totalIncomingsNumber: totalIncs,
                        };
                    },
                    function () {
                        if (DEBUG) {
                            console.debug(
                                `${scriptInfo} playersData`,
                                playersData
                            );
                        }

                        try {
                            const playerIncomingsTable =
                                buildPlayerIncomingsTable(playersData);

                            const customStyle = `
                                .ra-player-incomings { margin-bottom: 10px; border: 1px solid #7d510f; }
                                .ra-player-incomings:last-child { margin-bottom: 0; }
                                .ra-player-incomings h3 { user-select: none; font-weight: normal; margin: 0; padding: 5px; font-size: 14px; background-color: #cfb278 !important; position: relative; cursor: pointer; }
                                .ra-toggle-icon { float: right; }
                                .ra-player-incomings-table { display: none; padding: 5px; }
                                .ra-table th { background-color: #d2b170 !important; background-image: none !important; }
                            `;

                            // render the scripts UI
                            twSDK.renderBoxWidget(
                                playerIncomingsTable,
                                'raTribePlayersUnderAttack',
                                'ra-tribe-players-under-attack',
                                customStyle
                            );

                            // init action handlers
                            togglePlayerExpandableWidget();
                            handleClickMassSupport();
                        } catch (error) {
                            UI.ErrorMessage(twSDK.tt('There was an error!'));
                            console.error(`${scriptInfo} Error:`, error);
                        }
                    },
                    function () {
                        UI.ErrorMessage(
                            twSDK.tt('Error fetching player incomings!')
                        );
                    }
                );
            } else {
                try {
                    const tribeMembers = await getTribeMembersListNotLeader();

                    const tribeMembersData = [...tribeMembers];
                    const tribeMemberUrls = tribeMembers.map(
                        (item) => item.url
                    );

                    // Show progress bar and notify user
                    twSDK.startProgressBar(tribeMemberUrls.length);

                    twSDK.getAll(
                        tribeMemberUrls,
                        function (index, data) {
                            twSDK.updateProgressBar(
                                index,
                                tribeMemberUrls.length
                            );

                            // parse reponse as html
                            const htmlDoc = jQuery.parseHTML(data);
                            let incomingsCount = jQuery(htmlDoc)
                                .find(
                                    `.table-responsive table tr:first th:last`
                                )
                                .text()
                                .trim();
                            incomingsCount = parseInt(
                                incomingsCount.substring(
                                    1,
                                    incomingsCount.length - 1
                                )
                            );

                            // update players info
                            tribeMembersData[index] = {
                                ...tribeMembersData[index],
                                incomings: incomingsCount,
                            };
                        },
                        function () {
                            if (DEBUG) {
                                console.debug(
                                    `${scriptInfo} tribeMembersData`,
                                    tribeMembersData
                                );
                            }

                            try {
                                let dialogContent = `
                                    <div class="ra-popup-content ra-mb15">
                                        <table class="ra-table vis" width="100%">
                                            <thead>
                                                <tr>
                                                    <th class="ra-tal">
                                                        ${twSDK.tt(
                                                            'Player Name'
                                                        )}
                                                    </th>
                                                    <th>
                                                        ${twSDK.tt('Incomings')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                `;

                                const playersWhoHaveShared = tribeMembersData
                                    .filter(
                                        (tribeMember) => tribeMember.incsShown
                                    )
                                    .sort((a, b) => b.incomings - a.incomings);

                                const playersWhoHaveNotShared =
                                    tribeMembersData.filter(
                                        (tribeMember) => !tribeMember.incsShown
                                    );

                                const tribeMembersList = [
                                    ...playersWhoHaveShared,
                                    ...playersWhoHaveNotShared,
                                ];

                                tribeMembersList.sort((a, b) => {
                                    return b.incomings - a.incomings;
                                });

                                tribeMembersList.forEach((tribeMember) => {
                                    const { id, name, incomings, incsShown } =
                                        tribeMember;
                                    const className = incsShown
                                        ? ''
                                        : 'incs-shown-disabled';

                                    dialogContent += `
                                        <tr class="${className}">
                                            <td class="ra-tal">	
                                                <a href="/game.php?screen=info_player&id=${id}" target="_blank" rel="noopener noreferrer">
                                                    ${twSDK.cleanString(name)}
                                                </a>
                                            </td>
                                            <td>${twSDK.formatAsNumber(
                                                incomings
                                            )}</td>
                                        </tr>
                                    `;
                                });

                                dialogContent += `</tbody></table></div>`;

                                const customStyle = `
                                    .incs-shown-disabled td { opacity: 0.5; }
                                `;

                                twSDK.renderFixedWidget(
                                    dialogContent,
                                    'raTribePlayersUnderAttack',
                                    'ra-tribe-players-under-attack',
                                    customStyle
                                );
                            } catch (error) {
                                console.error(`${scriptInfo} Error:`, error);
                            }
                        },
                        function () {
                            UI.ErrorMessage(
                                twSDK.tt('Error fetching player incomings!')
                            );
                        }
                    );
                } catch (error) {
                    UI.ErrorMessage(twSDK.tt('There was an error!'));
                    console.error(`${scriptInfo} Error:`, error);
                }
            }
        }

        // Render: Build the player incomings table
        function buildPlayerIncomingsTable(playerIncomings) {
            let playerIncomingsList = ``;

            playerIncomings.sort(
                (a, b) => b.totalIncomingsNumber - a.totalIncomingsNumber
            );

            playerIncomings.forEach((player) => {
                const {
                    id,
                    incomings,
                    name,
                    totalIncomingsNumber,
                    totalPlayerVillages,
                    villagesUnderAttack,
                } = player;

                if (incomings.length) {
                    const incomingsTable =
                        buildSinglePlayerIncomingsTable(incomings);
                    const totalIncs =
                        twSDK.formatAsNumber(totalIncomingsNumber);
                    const villagesUnderAttackCount =
                        twSDK.formatAsNumber(villagesUnderAttack);

                    const incomingsPerVillageUnderAttackRatio = parseFloat(
                        totalIncomingsNumber / villagesUnderAttack
                    ).toFixed(2);
                    const incomingsPerTotalVillageRatio = parseFloat(
                        totalIncomingsNumber / totalPlayerVillages
                    ).toFixed(2);

                    playerIncomingsList += `
                        <div class='ra-player-incomings'>
                            <h3 class="ra-player-incomings-toggle">
                                <a href='/game.php?screen=info_player&id=${id}' target='_blank' rel='noopener noreferrer'>
                                    ${name}
                                </a> <b>(${twSDK.formatAsNumber(
                                    villagesUnderAttackCount
                                )}/${twSDK.formatAsNumber(
                        totalPlayerVillages
                    )})</b>
                                - ${twSDK.tt(
                                    'Incomings'
                                )}: <b>${totalIncs}</b> - ${twSDK.tt(
                        'Incs/Village Under Attack:'
                    )} <b>${incomingsPerVillageUnderAttackRatio}</b> - ${twSDK.tt(
                        'Incs/Total Village:'
                    )} <b>${incomingsPerTotalVillageRatio}</b>
                                <span class="ra-toggle-icon">
                                    <img src="/graphic/plus.png">
                                </span>
                            </h3>
                            <div class="ra-player-incomings-table">
                                ${incomingsTable}
                            </div>
                        </div>
                    `;
                }
            });

            if (playerIncomingsList.length === 0) {
                playerIncomingsList = `<b>${twSDK.tt(
                    'No player is under attack!'
                )}</b>`;
            }

            return playerIncomingsList;
        }

        // Render: Build the incomings table
        function buildSinglePlayerIncomingsTable(incomings) {
            let troopsHead = '';
            game_data.units.forEach((unit) => {
                if (unit !== 'militia') {
                    troopsHead += `<th width="6.5%"><img src="/graphic/unit/unit_${unit}.png"></th>`;
                }
            });

            let incomingsTable = `
                <table class="ra-table" width="100%">
                    <thead>
                        <tr>
                            <th width="20%">
                                ${twSDK.tt('Village')}
                            </th>
                            <th width="7%">
                                <img src="/graphic/unit/att.png">
                            </th>
                            ${troopsHead}
                            <th widh="7%">
                                ${twSDK.tt('Support')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            // sort player incomings on villages by the village which has the most incomings
            incomings.sort((a, b) => {
                return b.incsCount - a.incsCount;
            });

            incomings.forEach((incoming) => {
                const { incsCount, troops, villageName, villageId } = incoming;
                const villageTroops = buildVillageTroops(troops);
                const supportUrl = `${game_data.link_base_pure}place&mode=call&target=${villageId}&village=${game_data.village.id}`;
                incomingsTable += `
                    <tr>
                        <td class="ra-tal">
                            <a href="/game.php?screen=info_village&id=${villageId}" target="_blank" rel="noopener noreferrer">
                                ${villageName}
                            </a>
                        </td>
                        <td>
                            ${twSDK.formatAsNumber(incsCount)}
                        </td>
                        ${villageTroops}
                        <td>
                            <a href="${supportUrl}" class="btn ra-ask-support-btn" target="_blank" rel="noopener noreferrer">
                                ${twSDK.tt('Support')}
                            </a>
                        </td>
                    </tr>
                `;
            });

            incomingsTable += `</tbody></table>`;

            return incomingsTable;
        }

        // Render: Build village troops
        function buildVillageTroops(troops) {
            let villageTroops = ``;
            game_data.units.forEach((unit) => {
                if (unit !== 'militia') {
                    villageTroops += `
					<td>
						${twSDK.formatAsNumber(troops[unit])}
					</td>
				`;
                }
            });
            return villageTroops;
        }

        // Helper: Fetch players list
        async function getTribeMembersList() {
            let troopsMemberPage =
                '/game.php?village=' +
                game_data.village.id +
                '&screen=ally&mode=members_defense';
            if (game_data.player.sitter != '0') {
                troopsMemberPage += '&t=' + game_data.player.id;
            }

            const response = await jQuery.get(troopsMemberPage);
            const options = jQuery(response).find(
                '.input-nicer option:not([disabled])'
            );

            const membersToFetch = [];

            options.map(function (_, option) {
                let url =
                    '/game.php?screen=ally&mode=members_defense&player_id=' +
                    option.value +
                    '&village=' +
                    game_data.village.id +
                    '';
                if (game_data.player.sitter != '0') {
                    url += '&t=' + game_data.player.id;
                }
                if (!isNaN(parseInt(option.value))) {
                    membersToFetch.push({
                        url: url,
                        id: parseInt(option.value),
                        name: option.text,
                    });
                }
            });

            return membersToFetch;
        }

        // Helper: Fetch players list when you are not a tribe leader
        async function getTribeMembersListNotLeader() {
            let troopsMemberPage =
                '/game.php?village=' +
                game_data.village.id +
                '&screen=ally&mode=members_troops';
            if (game_data.player.sitter != '0') {
                troopsMemberPage += '&t=' + game_data.player.id;
            }

            const response = await jQuery.get(troopsMemberPage);
            const options = jQuery(response).find('.input-nicer option');

            const membersToFetch = [];

            options.map(function (_, option) {
                let url =
                    '/game.php?screen=ally&mode=members_troops&player_id=' +
                    option.value +
                    '&village=' +
                    game_data.village.id;

                if (game_data.player.sitter != '0') {
                    url += '&t=' + game_data.player.id;
                }
                if (!isNaN(parseInt(option.value))) {
                    membersToFetch.push({
                        url: url,
                        id: parseInt(option.value),
                        name: twSDK.cleanString(option.text),
                        incsShown: !option.disabled,
                    });
                }
            });

            return membersToFetch;
        }

        // Action Handler: Toggle player expandable widget
        function togglePlayerExpandableWidget() {
            jQuery('.ra-player-incomings-toggle').on('click', function () {
                jQuery(this)
                    .parent()
                    .find('.ra-player-incomings-table')
                    .slideToggle(50);
                const toggleIcon = jQuery(this).find('.ra-toggle-icon img');
                const toggleIconSrc = jQuery(toggleIcon).attr('src');
                if (toggleIconSrc === '/graphic/minus.png') {
                    jQuery(toggleIcon).attr('src', '/graphic/plus.png');
                } else {
                    jQuery(toggleIcon).attr('src', '/graphic/minus.png');
                }
            });
        }

        // Action Handler: Handle click of mass support button
        function handleClickMassSupport() {
            jQuery('.ra-ask-support-btn').on('click', function () {
                jQuery(this).addClass('btn-confirm-yes');
            });
        }
    }
);

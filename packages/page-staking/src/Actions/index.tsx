/* eslint-disable @typescript-eslint/no-empty-function */
// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { DerivedHeartbeats, DerivedStakingOverview } from '@polkadot/api-derive/types';
import { AccountId, StakingLedger } from '@polkadot/types/interfaces';

import React, { useEffect, useState } from 'react';
import { Button } from '@polkadot/react-components';
import { useCall, useApi, useAccounts } from '@polkadot/react-hooks';
import { Option } from '@polkadot/types';

import Account from './Account';
import StartStaking from './NewStake';
import { useTranslation } from '../translate';
import { RowTitle, Box, SorryNote, ActionNote } from '@polkadot/react-darwinia/components';

interface Props {
  allStashes: string[];
  className?: string;
  isVisible: boolean;
  recentlyOnline?: DerivedHeartbeats;
  next: string[];
  stakingOverview?: DerivedStakingOverview;
  accountChecked: string;
}

function getStashes (allAccounts: string[], stashTypes: Record<string, number>, queryBonded?: Option<AccountId>[], queryLedger?: Option<StakingLedger>): [string, boolean][] | null {
  let result: [string, boolean][] = [];

  if (!queryBonded || !queryLedger) {
    return null;
  }

  queryBonded.forEach((value, index): void => {
    value.isSome && (result = [[allAccounts[index], true]]);
  });

  if (queryLedger.isSome) {
    const stashId = queryLedger.unwrap().stash.toString();

    !result.some(([accountId]): boolean => accountId === stashId) && (result = [[stashId, false]]);
  }

  return result.sort((a, b): number =>
    (stashTypes[a[0]] || 99) - (stashTypes[b[0]] || 99)
  );
}

export default function Actions ({ allStashes, className, isVisible, next, recentlyOnline, stakingOverview, accountChecked }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { api } = useApi();
  const { allAccounts } = useAccounts();
  const queryBonded = useCall<Option<AccountId>[]>(api.query.staking.bonded.multi as any, [[accountChecked]]);
  const queryLedger = useCall<Option<StakingLedger>>(api.query.staking.ledger as any, [accountChecked]);
  const [isNewStakeOpen, setIsNewStateOpen] = useState(false);
  const [foundStashes, setFoundStashes] = useState<[string, boolean][] | null>(null);
  const [stashTypes, setStashTypes] = useState<Record<string, number>>({});

  useEffect((): void => {
    setFoundStashes(getStashes(allAccounts, stashTypes, queryBonded, queryLedger));
  }, [allAccounts, queryBonded, queryLedger, stashTypes]);

  const _toggleNewStake = (): void => setIsNewStateOpen(!isNewStakeOpen);
  const _onUpdateType = (stashId: string, type: 'validator' | 'nominator' | 'started' | 'other'): void =>
    setStashTypes({
      ...stashTypes,
      [stashId]: type === 'validator'
        ? 1
        : type === 'nominator'
          ? 5
          : 9
    });

  return (
    <div className={`staking--Actions ${className} ${!isVisible && 'staking--hidden'}`}>
      {isNewStakeOpen && (
        <StartStaking onClose={_toggleNewStake} accountId={accountChecked} />
      )}

      {foundStashes?.length
        ? (
          <>
            {foundStashes.map(([stashId, isOwnStash]): React.ReactNode => (
              <>

                <Account
                  allStashes={allStashes}
                  isOwnStash={isOwnStash}
                  key={stashId}
                  next={next}
                  onUpdateType={_onUpdateType}
                  recentlyOnline={recentlyOnline}
                  stakingOverview={stakingOverview}
                  stashId={stashId}
                />
              </>
            ))}
          </>
        )
        : <div>
          <RowTitle title={t('My Nomination')} />
          <Box>
            <Button.Group>
              <Button
                isPrimary
                key='new-stake'
                label={t('New stake')}
                icon='add'
                onClick={_toggleNewStake}
              />
            </Button.Group>
          </Box>
          <RowTitle title={t('Power Manager')} />
          <RowTitle title={t('Start')} />
          <ActionNote onStart={() => { }} type="nominate" />
          <RowTitle title={t('Note')} />
          <SorryNote type="nominate" />
        </div>
      }
    </div>
  );
}

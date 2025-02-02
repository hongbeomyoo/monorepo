/* eslint-disable max-len */
import {
  Alert24Filled,
  DoorArrowLeft24Regular,
  IosArrowLtr24Regular,
  Globe24Regular,
  Settings24Filled,
  People24Filled,
  SpinnerIos20Regular,
} from '@fluentui/react-icons';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import useMainClassroom from '../../hooks/useMainClassroom';
import useScreenType from '../../hooks/useScreenType';
import meState from '../../recoil/me';
import { HeaderMenu } from '../../types/header';
import ScreenType from '../../types/screen';
import AmbientButton from '../buttons/AmbientButton';
import LogoButton from '../buttons/LogoButton';

interface Props {
  onMenu?: (menu: HeaderMenu) => void;
}

const Header: React.FC<Props> = ({ onMenu = () => {} }) => {
  const screenType = useScreenType();
  const location = useLocation();
  const history = useHistory();
  const me = useRecoilValue(meState.atom);
  const mainClassroom = useMainClassroom();

  const inClassroom = /^\/classrooms\/\w{3}-\w{3}-\w{3}$/.test(location.pathname);
  const isMobileLandscapeUIVisible = true; // TODO

  const isMainButtonsVisible = (
    screenType === ScreenType.Desktop
    || (screenType === ScreenType.MobilePortrait && !inClassroom)
    || (screenType === ScreenType.MobileLandscape && !inClassroom && isMobileLandscapeUIVisible)
  );
  const isClassroomButtonsVisible = inClassroom && (
    screenType !== ScreenType.MobileLandscape || isMobileLandscapeUIVisible
  );

  return (
    <div
      className="w-100vw h-16 px-4 py-3 fixed top-0 items-center content-center flex justify-between z-layout bg-white"
      style={{
        height: 'calc(env(safe-area-inset-top, 0px) + 64px)',
        boxShadow: '0 0 16px 0 rgba(0, 0, 0, 0.25)',
      }}
    >
      <div className="flex items-center">
        {/* Back button or Logo */}
        <div className="w-10 h-10 mr-4 flex justify-center items-center">
          {inClassroom ? (
            <AmbientButton
              alt="Back"
              icon={(
                <IosArrowLtr24Regular
                  className="inline-block"
                  style={{ transform: 'translateX(3px)' }}
                />
              )}
              onClick={() => {
                if (history.length > 0) {
                  history.goBack();
                } else {
                  history.push('/');
                }
              }}
            />
          ) : (
            <LogoButton
              onClick={() => {
                if (me.loaded && (!me.info || me.info.initialized) && location.pathname !== '/') {
                  history.push('/');
                }
              }}
            />
          )}
        </div>
        {/* Classroom Name */}
        {mainClassroom && inClassroom && screenType === ScreenType.MobilePortrait && (
        <div
          style={{
            maxWidth: 'calc(100% - 54px)',
            lineClamp: 2,
            WebkitLineClamp: 2,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
          }}
          className="flex items-center overflow-hidden max-h-full"
        >
          <span className="font-semibold text-base" style={{ lineHeight: '19px' }}>
            {mainClassroom.name}
          </span>
        </div>
        )}
        {mainClassroom && inClassroom && screenType === ScreenType.Desktop && (
        <div>
          <span className="font-semibold text-base" style={{ lineHeight: '19px' }}>
            {mainClassroom.name}
          </span>
        </div>
        )}
      </div>
      <div className="flex gap-4">
        {/* Classroom Buttons */}
        {isClassroomButtonsVisible && (
        <>
          <AmbientButton alt="Members" icon={<People24Filled />} filled onClick={() => onMenu('members')} />
          <AmbientButton alt="Settings" icon={<Settings24Filled />} filled onClick={() => onMenu('settings')} />
        </>
        )}
        {isMainButtonsVisible && (
        <>
          <AmbientButton
            alt="Langauge Selection"
            className="mr-2.5"
            icon={(
              <span className="w-6 h-6">
                <span className="inline-flex items-center w-10">
                  <Globe24Regular />
                  {/* Downward Arrow */}
                  <svg className="ml-1" width="12.5" height="7.5" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L4.29289 4.29289C4.68342 4.68342 5.31658 4.68342 5.70711 4.29289L9 1" stroke="#46444A" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </span>
                )}
            onClick={() => onMenu('language')}
          />
          <AmbientButton alt="Notifications" icon={<Alert24Filled />} filled onClick={() => onMenu('notifications')} />
          {!me.loaded ? (
            <AmbientButton
              alt="Account Settings (Logging in)"
              icon={<SpinnerIos20Regular className="animate-spin block" style={{ height: 20 }} />}
              onClick={() => onMenu('profile')}
            />
          ) : me.info ? (
            <AmbientButton
              alt="Account Settings"
              icon={(
                <img
                  src={me.info.profileImage}
                  alt="Profile"
                  className="w-10 h-10 rounded-full overflow-hidden object-cover object-center shadow-button"
                  style={{ '--shadow-color': 'rgba(0, 0, 0, 0.1)' } as React.CSSProperties}
                />
                  )}
              isImageIcon
              onClick={() => onMenu('profile')}
            />
          ) : (
            <AmbientButton
              alt="Account Settings"
              icon={<DoorArrowLeft24Regular />}
              onClick={() => {
                if (location.pathname !== '/login') {
                  history.push(`/login?redirect_uri=${location.pathname}`);
                }
              }}
            />
          )}
        </>
        )}
      </div>
    </div>

  );
};

export default Header;

/*

      {isMobileLandscapeUI && (
        <div
          className="w-100vw h-16 px-4 py-3 fixed top-0 items-center content-center flex justify-between z-layout-3"
          style={{
            height: 'calc(env(safe-area-inset-top, 0px) + 64px)',
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0))',
          }}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 mr-4">
              {isMobileLandscapeUIVisible && (
                <AmbientButton
                  alt="Back"
                  icon={(
                    <IosArrowLtr24Regular
                      className="inline-block"
                      style={{ transform: 'translateX(3px)' }}
                    />
                  )}
                  onClick={() => {
                    history.push('/');
                  }}
                  dark
                />
              )}
            </div>
          </div>
          <div className="flex gap-4">
            {isClassroomButtonsVisible && (
              <>
                <AmbientButton alt="Members" icon={<People24Filled />} filled onClick={() => onMenu('members')} dark />
                <AmbientButton alt="Settings" icon={<Settings24Filled />} filled onClick={() => onMenu('settings')} dark />
              </>
            )}
          </div>
        </div>
      )}

      */

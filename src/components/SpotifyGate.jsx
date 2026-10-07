import { useSpotifyConnection } from '../hooks/SpotifyContext';
import Icon from './Icon';
import Modal from './Modal';

export default function SpotifyGate({ onContinue, onClose, started }) {
  const spotify = useSpotifyConnection();
  return <Modal title="Escolha sua trilha sonora" onClose={onClose} className="spotify-gate">
    <div className="gate-emblem"><Icon name="music" size={28} /></div>
    <p className="eyebrow">Antes de viajar</p>
    <h3>A nossa história<br />também tem uma<br /><em>trilha sonora.</em></h3>
    <p>Conecte o Spotify para escolher as músicas que acompanham cada lembrança. Ou siga no seu próprio silêncio.</p>
    <p className="gate-note">A reprodução aqui requer Spotify Premium. As memórias estão sempre disponíveis.</p>
    {spotify.message && <p className="gate-status" role="status">{spotify.message}</p>}
    {spotify.authenticated ? <>
      <p className="gate-connected"><Icon name="spotify" size={17} />{spotify.status === 'connecting' ? 'Conectando o player…' : spotify.status === 'connected' ? 'Seu Spotify está conectado.' : 'Sua conta está conectada. A reprodução pode estar indisponível.'}</p>
      <button className="button primary" data-autofocus onClick={onContinue}>{started ? 'Voltar à viagem' : 'Começar a viagem'}<Icon name="arrow" /></button>
      <button className="text-button gate-secondary" onClick={spotify.disconnect}>Desconectar Spotify</button>
      {['unavailable', 'premium-required'].includes(spotify.status) && <button className="text-button gate-secondary" onClick={spotify.connect}>Tentar conectar novamente</button>}
    </> : <>
      <button className="button primary spotify-connect" data-autofocus disabled={spotify.status === 'connecting'} onClick={spotify.connect}><Icon name="spotify" />{spotify.status === 'connecting' ? 'Conectando…' : 'Conectar ao Spotify'}<Icon name="arrow" /></button>
      <button className="text-button gate-secondary" onClick={onContinue}>{started ? 'Voltar à viagem' : 'Continuar sem Spotify'}</button>
    </>}
  </Modal>;
}

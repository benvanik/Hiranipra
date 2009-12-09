#include <stdio.h>
#include <tchar.h>

#include <fbxsdk.h>
#include <fbxfilesdk/fbxfilesdk_nsuse.h>

int main( int argc, char* argv[] )
{
    if( argc < 3 )
    {
        fprintf( stdout, "usage: modelconverter input.fbx output.json" );
        return 0;
    }
    const char* inputFile = argv[ 1 ];
    const char* outputFile = argv[ 2 ];

    KFbxSdkManager* sdkManager = KFbxSdkManager::Create();
    KFbxImporter* importer = KFbxImporter::Create( sdkManager, "" );
    KFbxScene* scene = KFbxScene::Create( sdkManager, "" );

    int fileFormat = -1;
    if( sdkManager->GetIOPluginRegistry()->DetectFileFormat( inputFile, fileFormat ) == false )
    {
        fprintf( stdout, "! unable to detect file format" );
        goto CLEANUP;
    }

    if( importer->Initialize( inputFile, fileFormat ) == false )
    {
        fprintf( stdout, "! unable to initialize importer" );
        goto CLEANUP;
    }

    #define IOSREF KFbxIOSettings::IOSettingsRef()
    IOSREF.SetBoolProp( IMP_FBX_MATERIAL,           true );
    IOSREF.SetBoolProp( IMP_FBX_TEXTURE,            true );
    IOSREF.SetBoolProp( IMP_FBX_LINK,               false );
    IOSREF.SetBoolProp( IMP_FBX_SHAPE,              false );
    IOSREF.SetBoolProp( IMP_FBX_GOBO,               false );
    IOSREF.SetBoolProp( IMP_FBX_ANIMATION,          true );
    IOSREF.SetBoolProp( IMP_FBX_GLOBAL_SETTINGS,    true );
    #undef IOSREF

    if( importer->Import( scene ) == false )
    {
        fprintf( stdout, "! failed to import" );
        goto CLEANUP;
    }



CLEANUP:
    scene->Destroy();
    importer->Destroy();
    sdkManager->Destroy();
	return 0;
}
